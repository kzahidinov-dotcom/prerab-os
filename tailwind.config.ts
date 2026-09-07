import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
