/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      colors: {
        aura: {
          50: "#f8f6f4",
          100: "#efeae5",
          200: "#ddd4ca",
          300: "#c4b5a6",
          400: "#a8927e",
          500: "#8f7862",
          600: "#7a6452",
          700: "#655244",
          800: "#54453b",
          900: "#473c34",
          950: "#261f1a",
        },
      },
    },
  },
  plugins: [],
};
