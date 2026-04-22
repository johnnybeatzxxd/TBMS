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
          DEFAULT: "#2563EB",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
          800: "#1E3A8A",
          900: "#172554",
        },
        secondary: {
          DEFAULT: "#F97316",
          50: "#FFF7ED",
          500: "#F97316",
          600: "#EA580C",
        },
        success: {
          DEFAULT: "#16A34A",
          50: "#F0FDF4",
          500: "#16A34A",
          600: "#15803D",
        },
        warning: {
          DEFAULT: "#EAB308",
          50: "#FEFCE8",
          500: "#EAB308",
          600: "#CA8A04",
        },
        danger: {
          DEFAULT: "#DC2626",
          50: "#FEF2F2",
          500: "#DC2626",
          600: "#B91C1C",
        },
        info: {
          DEFAULT: "#0EA5E9",
          50: "#F0F9FF",
          500: "#0EA5E9",
          600: "#0284C7",
        },
        surface: "#F8FAFC",
        border: "#E2E8F0",
        "text-primary": "#0F172A",
        "text-secondary": "#64748B",
        "text-muted": "#94A3B8",
      },
      fontFamily: {
        sans: ["Inter", "System"],
      },
    },
  },
  plugins: [],
};
