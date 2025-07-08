/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0083D7",
          start: "#0083D7",
          end: "#00A4FF",
        },
        "dark-neutral": "#111827",
        "light-neutral": "#F6F9FC",
        "accent-gray": "#6B7280",
        // For gradient backgrounds
        "primary-gradient": "linear-gradient(90deg, #0083D7 0%, #00A4FF 100%)",
        background: "#F6F9FC",
        foreground: "#111827",
        card: "#fff",
        "card-foreground": "#111827",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["Roboto Mono", "ui-monospace", "SFMono-Regular"],
      },
      boxShadow: {
        'hex': '0 4px 24px 0 rgba(0, 131, 215, 0.08)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}; 