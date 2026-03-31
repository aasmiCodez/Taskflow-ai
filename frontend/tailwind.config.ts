import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eefbf9",
          100: "#d5f4ef",
          200: "#afe7df",
          300: "#7fd3c7",
          400: "#45b8aa",
          500: "#1f9a8e",
          600: "#0f766e",
          700: "#0d5d57",
          800: "#104b47",
          900: "#103f3c",
        },
      },
      boxShadow: {
        panel: "0 24px 80px rgba(15, 23, 42, 0.20)",
      },
      backgroundImage: {
        ambient:
          "radial-gradient(circle at top left, rgba(45, 212, 191, 0.16), transparent 30%), radial-gradient(circle at bottom right, rgba(251, 191, 36, 0.14), transparent 24%), linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(10, 14, 26, 0.98))",
      },
    },
  },
  plugins: [],
} satisfies Config;
