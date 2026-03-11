/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
        fontFamily: {
            sans: ['var(--font-inter)', 'sans-serif'],
        },
    },
  },
  plugins: [],
};
