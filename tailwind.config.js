/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f0fdf4",
        "on-background": "#052e16",
        primary: {
          DEFAULT: "#15803d",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        accent: {
          DEFAULT: "#d97706",
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        surface: "#ffffff",
        "on-surface": "#052e16",
        "on-surface-variant": "#3f4d44",
        "surface-container-low": "#f7fdf9",
        "surface-container": "#eefcf2",
        "surface-container-high": "#dcfce7",
        "surface-container-highest": "#c9f5d6",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.12)",
        "card-lg":
          "0 4px 12px rgba(15,23,42,0.06), 0 16px 48px -16px rgba(15,23,42,0.18)",
        "2xs": "0 1px 2px rgba(15,23,42,0.05)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        lexend: ["Lexend", "sans-serif"],
      },
    },
  },
  plugins: [],
};
