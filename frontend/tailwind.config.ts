// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Futuristic color palette
      colors: {
        'cyber-teal': '#00f7ff',
        'hologram-purple': '#d400ff',
        'matrix-green': '#00ff41',
        'neon-yellow': '#fff000',
        'glitch-pink': '#ff00ff',
        'void-black': '#05050a',
      },
      
      // Custom animations
      animation: {
        'hologram-pulse': 'hologramPulse 3s infinite',
        'cyber-glitch': 'cyberGlitch 5s infinite',
        'neon-border': 'neonBorder 4s infinite',
      },
      
      // Keyframes for animations
      keyframes: {
        hologramPulse: {
          '0%, 100%': { opacity: '0.8', filter: 'hue-rotate(0deg)' },
          '50%': { opacity: '1', filter: 'hue-rotate(45deg)' },
        },
        cyberGlitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translate(-2px, 2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translate(2px, -2px)' },
        },
        neonBorder: {
          '0%, 100%': { 'box-shadow': '0 0 5px #00f7ff, 0 0 10px #00f7ff' },
          '50%': { 'box-shadow': '0 0 20px #d400ff, 0 0 30px #d400ff' },
        },
      },
    },
  },
  plugins: [],
};

export default config;