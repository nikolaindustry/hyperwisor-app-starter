import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-foreground": "var(--color-primary-foreground)",
        accent: "var(--color-accent)",
        background: "var(--color-background)",
        card: "var(--color-card)",
        surface: "var(--color-surface)",
        foreground: "var(--color-text)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
      },
      fontFamily: { sans: "var(--font-sans)" },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 0.25rem)",
        md: "calc(var(--radius) - 0.25rem)",
        sm: "calc(var(--radius) - 0.4rem)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.22s ease-out",
        shimmer: "shimmer 1.4s infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
