import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg, #f4f6f9)",
        foreground: "var(--ink, #182230)",
        surface: "var(--surface, #ffffff)",
        muted: {
          DEFAULT: "var(--muted, #778397)",
          foreground: "var(--muted, #778397)",
        },
        border: "var(--line, #e8edf2)",
        brand: {
          DEFAULT: "#e97825",
          soft: "#fff1e7",
          dark: "#c7631b",
          light: "#ff9b48",
        },
        nav: {
          DEFAULT: "#172334",
          muted: "#a9b5c5",
          hover: "#ffffff0d",
          active: "#ed802a",
        },
        status: {
          green: "#16865b",
          "green-bg": "#eaf7f0",
          red: "#c94c4c",
          "red-bg": "#fff0f0",
          blue: "#3778c2",
          "blue-bg": "#edf5ff",
          amber: "#a76b12",
          "amber-bg": "#fff6e6",
        },
      },
      fontFamily: {
        cairo: ["Cairo", "Tahoma", "Arial", "sans-serif"],
      },
      borderRadius: {
        card: "15px",
        element: "10px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(25, 42, 65, 0.055)",
        btn: "0 2px 4px rgba(24, 34, 48, 0.06)",
        accent: "0 5px 14px rgba(233, 120, 37, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
