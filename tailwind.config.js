/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        coal: {
          50: "#f7f7f4",
          100: "#efefea",
          200: "#dfdfd8",
          300: "#c5c5bc",
          500: "#6b6b63",
          700: "#31312c",
          900: "#121210",
        },
        signal: {
          50: "#fdf6da",
          100: "#fbeec1",
          500: "#f4cf3f",
          600: "#d9b227",
        },
        electric: {
          50: "#edf2ff",
          100: "#d7e2ff",
          500: "#2d63ff",
          600: "#214bcb",
        },
        moss: {
          50: "#edf6eb",
          100: "#d6e8d1",
          500: "#3d7a35",
          600: "#2f5f29",
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Space Grotesk"', '"Segoe UI"', "sans-serif"],
        display: ['"Inter"', '"Archivo"', '"Space Grotesk"', '"Segoe UI"', "sans-serif"],
      },
      boxShadow: {
        edge: "0 24px 40px -32px rgba(18, 18, 16, 0.65), 0 8px 18px -14px rgba(18, 18, 16, 0.36)",
        chip: "0 6px 12px -8px rgba(18, 18, 16, 0.35)",
      },
      keyframes: {
        enter: {
          "0%": {
            opacity: "0",
            transform: "translateY(12px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        marquee: {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100vw)",
          },
        },
      },
      animation: {
        enter: "enter 520ms cubic-bezier(0.2, 0.9, 0.3, 1) both",
        marquee: "marquee 20s linear infinite",
      },
    },
  },
  plugins: [],
};
