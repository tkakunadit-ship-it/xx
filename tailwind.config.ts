import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0E0F12",
        panel: "#16181D",
        panel2: "#1D2027",
        line: "#292C33",
        muted: "#8A8D96",
        amber: "#E8A33D",
        teal: "#4FD1C5",
        rose: "#E2748C",
        indigo: "#6B7FE8",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
