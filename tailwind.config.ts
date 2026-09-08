import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        display: ["var(--font-display)", ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.10)",
        "card-hover": "0 4px 10px rgba(15, 23, 42, 0.06), 0 16px 36px -14px rgba(15, 23, 42, 0.16)",
        gold: "0 8px 24px -8px rgba(197, 155, 53, 0.45)",
        "inner-line": "inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Official PRERAB Gold Palette (derived from brand logo)
        brand: {
          50: "#fbf8f0",
          100: "#f5ecd7",
          200: "#ebdaa8",
          300: "#dfc374",
          400: "#d5ae4c",
          500: "#c59b35", // Main Brand Gold
          600: "#ad8029",
          700: "#8a5f23",
          800: "#724c23",
          900: "#603f21",
          950: "#36200f",
        },
        slate: {
          850: "#131823",
          900: "#0d111a",
          950: "#070a10",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
