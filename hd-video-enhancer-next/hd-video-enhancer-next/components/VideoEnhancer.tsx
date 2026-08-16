'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getFFmpeg, terminateFFmpeg } from '@/lib/ffmpeg';
import { validateVideoFile } from '@/lib/validation';
import { baseNameFromName, extensionFromName, formatBytes, formatDuration } from '@/lib/format';
import {
  AlertIcon,
  CloseIcon,
  DownloadIcon,
  FilmIcon,
  PlayIcon,
  RefreshIcon,
  StopIcon,
  UploadIcon,
} from './icons';

type Status = 'idle' | 'loading-engine' | 'processing' | 'done' | 'error';
type TargetHeight = 720 | 1080;

interface VideoMeta {
  width: number;
  height: number;
  duration: number;
  size: number;
  format: string;
}

const TARGET_OPTIONS: { height: TargetHeight; label: string }[] = [
  { height: 720, label: '1280×720' },
  { height: 1080, label: '1920×1080' },
];

const SCOPE_SEGMENTS = 28;

export function VideoEnhancer() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [targetHeight, setTargetHeight] = useState<TargetHeight>(1080);

  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [logTail, setLogTail] = useState('');

  const [fileError, setFileError] = useState('');
  const [processError, setProcessError] = useState('');

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);

  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const trackUrl = useCallback((url: string) => {
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  const revokeUrl = useCallback((url: string | null) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    objectUrlsRef.current.delete(url);
  }, []);

  // bersihkan semua object URL saat komponen unmount, agar tidak membocorkan memory
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const resetForNewFile = useCallback(() => {
    revokeUrl(previewUrl);
    revokeUrl(resultUrl);
    setPreviewUrl(null);
    setResultUrl(null);
    setResultSize(0);
    setFile(null);
    setMeta(null);
    setStatus('idle');
    setProgress(0);
    setLogTail('');
    setFileError('');
    setProcessError('');
  }, [previewUrl, resultUrl, revokeUrl]);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      const picked = list?.[0];
      if (!picked) return;

      const ext = extensionFromName(picked.name);
      const result = validateVideoFile(picked, ext);

      if (!result.valid) {
        setFileError(result.reason ?? 'File tidak valid.');
        return;
      }

      revokeUrl(previewUrl);
      revokeUrl(resultUrl);

      setFileError('');
      setProcessError('');
      setStatus('idle');
      setProgress(0);
      setLogTail('');
      setResultUrl(null);
      setResultSize(0);
      setMeta(null);
      setFile(picked);
      setPreviewUrl(trackUrl(URL.createObjectURL(picked)));
    },
    [previewUrl, resultUrl, revokeUrl, trackUrl]
  );

  const handleLoadedMetadata = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const v = e.currentTarget;
      if (!file || !v.videoWidth || !v.videoHeight) return;
      setMeta({
        width: v.videoWidth,
        height: v.videoHeight,
        duration: v.duration,
        size: file.size,
        format: extensionFromName(file.name).toUpperCase() || 'VIDEO',
      });
    },
    [file]
  );

  const resTag = useCallback(
    (h: TargetHeight): 'up' | 'down' | 'same' => {
      if (!meta) return 'same';
      if (h > meta.height) return 'up';
      if (h < meta.height) return 'down';
      return 'same';
    },
    [meta]
  );

  const runProcess = useCallback(async () => {
    if (!file) return;

    setProcessError('');
    setStatus('loading-engine');
    setProgress(0);
    setLogTail('');

    try {
      const ffmpeg = await getFFmpeg((message) => {
        setLogTail((prev) => `${prev}\n${message}`.split('\n').slice(-6).join('\n'));
      });

      ffmpeg.on('progress', ({ progress: p }) => {
        if (Number.isFinite(p)) setProgress(Math.min(1, Math.max(0, p)));
      });

      setStatus('processing');

      const { fetchFile } = await import('@ffmpeg/util');
      const inputExt = extensionFromName(file.name) || 'mp4';
      const inputName = `input.${inputExt}`;
      const outputName = 'output.mp4';

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // scale=-2:H mempertahankan rasio aspek asli (lebar dihitung otomatis, dibulatkan
      // ke kelipatan 2 agar valid untuk encoder H.264) — video tidak akan gepeng/stretch.
      const scaleFilter = `scale=-2:${targetHeight}`;
      const baseArgs = [
        '-i', inputName,
        '-vf', scaleFilter,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-movflags', '+faststart',
      ];

      try {
        // percobaan pertama: audio asli dipertahankan tanpa re-encode (stream copy)
        await ffmpeg.exec([...baseArgs, '-c:a', 'copy', outputName]);
      } catch {
        // fallback: codec audio sumber tidak kompatibel untuk copy ke container MP4 -> re-encode ke AAC
        setLogTail((prev) => `${prev}\n[info] stream-copy audio gagal, re-encode ke AAC...`);
        try {
          await ffmpeg.deleteFile(outputName);
        } catch {
          // belum sempat ditulis, aman diabaikan
        }
        await ffmpeg.exec([...baseArgs, '-c:a', 'aac', '-b:a', '160k', outputName]);
      }

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data as Uint8Array], { type: 'video/mp4' });
      const url = trackUrl(URL.createObjectURL(blob));

      setResultUrl(url);
      setResultSize(blob.size);
      setProgress(1);
      setStatus('done');

      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch {
        // file sementara di MEMFS ffmpeg, kegagalan hapus tidak fatal (hilang saat engine di-reset)
      }
    } catch (err) {
      setStatus('error');
      setProcessError(
        err instanceof Error
          ? `Proses gagal: ${err.message}`
          : 'Proses gagal karena kesalahan tidak dikenal. Coba file lain atau resolusi yang lebih rendah.'
      );
    }
  }, [file, targetHeight, trackUrl]);

  const handleCancel = useCallback(() => {
    terminateFFmpeg();
    setStatus('idle');
    setProgress(0);
    setLogTail('');
  }, []);

  const filledSegments =
    status === 'processing' || status === 'done' ? Math.round(progress * SCOPE_SEGMENTS) : 0;

  const statusLabel: Record<Status, string> = {
    idle: 'Menunggu',
    'loading-engine': 'Memuat Engine',
    processing: 'Memproses',
    done: 'Selesai',
    error: 'Gagal',
  };

  return (
    <>
      <section
        className={`dropzone ${dragOver ? 'dragover' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {!file && (
          <>
            <div className="dz-icon" aria-hidden="true">
              <UploadIcon />
            </div>
            <h3>Upload video kamu</h3>
            <p className="dz-sub">Seret &amp; lepas file di sini, atau pilih dari perangkat</p>
            <button type="button" className="select-btn" onClick={() => fileInputRef.current?.click()}>
              Pilih Video
            </button>
            <p className="dz-formats">MP4 · MOV · WEBM — maks 512MB</p>
            <p className="dz-desktop-hint">Bisa juga drag &amp; drop file langsung ke area ini.</p>
          </>
        )}

        {file && (
          <div className="file-row">
            <div className="file-thumb-wrap">
              {previewUrl ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={previewUrl}
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={handleLoadedMetadata}
                  onLoadedData={handleLoadedMetadata}
                />
              ) : (
                <FilmIcon />
              )}
            </div>
            <div className="file-meta">
              <div className="file-name">{file.name}</div>
              <div className="file-sub">
                {meta ? `${meta.width}×${meta.height} · ${formatBytes(meta.size)}` : 'Membaca metadata...'}
              </div>
            </div>
            <button type="button" className="file-remove" onClick={resetForNewFile} aria-label="Hapus file">
              <CloseIcon />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </section>

      {fileError && (
        <div className="banner error">
          <AlertIcon className="banner-icon" />
          <div>{fileError}</div>
        </div>
      )}

      {meta && (
        <>
          <div className="readout">
            <div className="readout-cell">
              <p className="readout-label">Resolusi</p>
              <p className="readout-value">
                {meta.width}×{meta.height}
              </p>
            </div>
            <div className="readout-cell">
              <p className="readout-label">Durasi</p>
              <p className="readout-value">{formatDuration(meta.duration)}</p>
            </div>
            <div className="readout-cell">
              <p className="readout-label">Ukuran</p>
              <p className="readout-value">{formatBytes(meta.size)}</p>
            </div>
            <div className="readout-cell">
              <p className="readout-label">Format</p>
              <p className="readout-value">{meta.format}</p>
            </div>
          </div>

          <p className="section-label">Resolusi Output</p>
          <div className="res-options">
            {TARGET_OPTIONS.map(({ height, label }) => {
              const tag = resTag(height);
              return (
                <button
                  key={height}
                  type="button"
                  disabled={status === 'loading-engine' || status === 'processing'}
                  className={`res-option ${targetHeight === height ? 'selected' : ''}`}
                  onClick={() => setTargetHeight(height)}
                >
                  <span className={`res-tag ${tag}`}>
                    {tag === 'up' ? 'UPSCALE' : tag === 'down' ? 'DOWNSCALE' : 'SAMA'}
                  </span>
                  <div className="res-name">{height}p</div>
                  <div className="res-detail">{label} · rasio dipertahankan</div>
                </button>
              );
            })}
          </div>

          {resTag(targetHeight) === 'up' && (
            <div className="banner warn">
              <AlertIcon className="banner-icon" />
              <div>
                Video sumber ({meta.height}p) lebih rendah dari target ({targetHeight}p). Hasil akan
                di-upscale memakai interpolasi standar (bukan AI super-resolution) — resolusi piksel
                bertambah, tapi detail baru tidak dimunculkan.
              </div>
            </div>
          )}

          {status !== 'done' && (
            <button
              type="button"
              className="run-btn"
              disabled={status === 'loading-engine' || status === 'processing'}
              onClick={runProcess}
            >
              <PlayIcon />
              {status === 'loading-engine' && 'Memuat engine...'}
              {status === 'processing' && 'Memproses...'}
              {status === 'error' && 'Coba Lagi'}
              {status === 'idle' && `Proses ke ${targetHeight}p`}
            </button>
          )}
        </>
      )}

      {(status === 'loading-engine' || status === 'processing' || status === 'error') && (
        <div className="process-panel">
          <div className="process-head">
            <span className="status-pill" data-state={status}>
              <span className="status-dot" />
              {statusLabel[status]}
            </span>
            {status === 'processing' && <span className="process-pct">{Math.round(progress * 100)}%</span>}
          </div>

          <div className="scope-bar" aria-hidden="true">
            {Array.from({ length: SCOPE_SEGMENTS }).map((_, i) => (
              <div key={i} className={`scope-seg ${i < filledSegments ? 'filled' : ''}`} />
            ))}
          </div>

          {status === 'loading-engine' && (
            <p className="process-note">Mengunduh &amp; menyiapkan engine FFmpeg (WebAssembly, ~30MB, sekali saja per sesi browser)...</p>
          )}

          {status === 'processing' && logTail && <p className="process-note">{logTail}</p>}

          {status === 'error' && (
            <>
              <div className="banner error" style={{ marginTop: 0 }}>
                <AlertIcon className="banner-icon" />
                <div>{processError}</div>
              </div>
              {logTail && <p className="process-note">{logTail}</p>}
              <div className="process-actions">
                <button type="button" className="btn primary" onClick={runProcess}>
                  <RefreshIcon /> Coba Lagi
                </button>
                <button type="button" className="btn" onClick={resetForNewFile}>
                  <CloseIcon /> Upload Ulang
                </button>
              </div>
            </>
          )}

          {(status === 'loading-engine' || status === 'processing') && (
            <div className="process-actions">
              <button type="button" className="btn" onClick={handleCancel}>
                <StopIcon /> Batalkan
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'done' && resultUrl && file && (
        <div className="result-panel">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video src={resultUrl} controls playsInline />

          <div className="readout" style={{ marginTop: 14 }}>
            <div className="readout-cell">
              <p className="readout-label">Output</p>
              <p className="readout-value">{targetHeight}p</p>
            </div>
            <div className="readout-cell">
              <p className="readout-label">Ukuran Hasil</p>
              <p className="readout-value">{formatBytes(resultSize)}</p>
            </div>
            <div className="readout-cell">
              <p className="readout-label">Format</p>
              <p className="readout-value">MP4</p>
            </div>
            <div className="readout-cell">
              <p className="readout-label">Status</p>
              <p className="readout-value">Selesai</p>
            </div>
          </div>

          <div className="result-actions">
            <a
              className="btn primary"
              href={resultUrl}
              download={`${baseNameFromName(file.name)}-${targetHeight}p.mp4`}
            >
              <DownloadIcon /> Simpan Video
            </a>
            <button type="button" className="btn" onClick={resetForNewFile}>
              <UploadIcon /> Proses Video Lain
            </button>
          </div>
        </div>
      )}
    </>
  );
}
