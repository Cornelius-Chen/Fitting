import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f4efe7",
        ink: "#13231a",
        pine: "#205c44",
        moss: "#6f8b4a",
        amber: "#e8a64c",
        peach: "#f0d4b4",
      },
      boxShadow: {
        soft: "0 18px 48px rgba(19, 35, 26, 0.08)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top, rgba(232, 166, 76, 0.3), transparent 45%), radial-gradient(circle at 80% 20%, rgba(32, 92, 68, 0.16), transparent 30%)",
      },
    },
  },
  plugins: [],
};

export default config;
