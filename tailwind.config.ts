import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8C875',
          dark: '#A07830',
          muted: '#C9A84C26',
        },
      },
      boxShadow: {
        luxury: '0 4px 24px rgba(0,0,0,0.08)',
        'luxury-lg': '0 12px 48px rgba(0,0,0,0.12)',
        'luxury-xl': '0 24px 64px rgba(0,0,0,0.16)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        'bounce-x': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%':      { transform: 'translateX(5px)' },
        },
        'scroll-pulse': {
          '0%, 79%, 100%': { transform: 'scaleY(0)' },
          '39%':           { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'fade-in':     'fadeIn 0.6s ease-out forwards',
        'fade-in-left':'fadeInLeft 0.6s ease-out forwards',
        'scale-in':    'scaleIn 0.4s ease-out forwards',
        shimmer:       'shimmer 2s infinite linear',
        marquee:       'marquee 44s linear infinite',
        'bounce-x':    'bounce-x 2s ease-in-out infinite',
        'scroll-pulse':'scroll-pulse 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
