/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fff5f3",
          100: "#fee7e2",
          500: "#E74C3C",
          600: "#C0392B",
          700: "#A93226",
          900: "#7B241C",
        },
        secondary: {
          50: "#fffbf0",
          100: "#fef5e7",
          500: "#F39C12",
          600: "#D68910",
          700: "#B9770E",
        },
        success: {
          500: "#27AE60",
          600: "#229954",
        },
        danger: {
          500: "#E74C3C",
          600: "#C0392B",
        },
        neutral: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          500: "#95A5A6",
          700: "#2C3E50",
          900: "#000000",
        },
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
