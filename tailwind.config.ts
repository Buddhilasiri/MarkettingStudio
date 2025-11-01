import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        brand: {
          navy: "#0B1220",
          gold: "#FFD147",
          purple: "#7E57C2",
          neutral: "#F9FAFB",
          text: "#1E1E1E"
        }
      },
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans]
      },
      boxShadow: {
        soft: "0 20px 45px -25px rgba(11, 18, 32, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
