/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1A56DB",
          50: "#EBF2FF",
          100: "#C3D8FF",
          200: "#9BBEFF",
          300: "#72A4FF",
          400: "#4A8AFF",
          500: "#1A56DB",
          600: "#1446B5",
          700: "#0F368F",
          800: "#092669",
          900: "#041643",
        },
        secondary: {
          DEFAULT: "#F97316",
          50: "#FFF4ED",
          500: "#F97316",
          600: "#EA6C0A",
        },
        success: "#16A34A",
        warning: "#CA8A04",
        danger: "#DC2626",
        surface: "#F8FAFC",
        dark: {
          DEFAULT: "#0F172A",
          100: "#1E293B",
          200: "#334155",
          300: "#475569",
        },
      },
      fontFamily: {
        sans: ["Inter", "System"],
      },
    },
  },
  plugins: [],
};
