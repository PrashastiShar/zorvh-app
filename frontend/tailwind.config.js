/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'void-black': '#0A0F16', // Changed from #000 to match your CSS var
        'treasure-gold': '#FFD166', // <--- ADD THIS LINE
        'globe-blue': '#3DCCC7',   // <--- ADD THIS LINE
        'cyber-teal': '#00f7ff',
        'hologram-purple': '#d400ff',
        'matrix-green': '#00ff00',
        'neon-yellow': '#FFFF00',
        'silver-metal': '#c0c0c0', // <--- ADD THIS LINE (from your CSS)
        'silver-light': '#e0e0e0', // <--- ADD THIS LINE (from your CSS)
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)']
      }
    },
  },
  plugins: [],
}