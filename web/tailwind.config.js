/** @type {import('tailwindcss').Config} */

// ========================================
// LUMERA - Identidade Visual
// "Uma nova era de brilho"
// ========================================
const lumeraColors = {
  roxoLumera: '#7B2EFF',      // Primária - moderno, premium, noturno
  azulGlow: '#4A6CFF',        // Secundária - brilho, tecnologia
  pretoObsidian: '#0A0A0B',   // Background principal (dark theme)
  brancoLuminoso: '#E8E8F0',  // Texto principal (light on dark)
  lilasNeon: '#C084FF',       // Destaque, elementos vibrantes
  douradoSuave: '#E0C87A',    // Premium, VIP
  cinzaFumaca: '#2A2A2E',     // Base para UI
};

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cor Primária - Roxo Lumera (#7B2EFF)
        primary: {
          50: '#F5F0FF',
          100: '#EBE0FF',
          200: '#D6C2FF',
          300: '#8A50EF',
          400: '#7028E4',
          500: '#7B2EFF',   // Roxo Lumera principal
          600: '#6B1FEF',
          700: '#5A14DF',
          800: '#4A0ACF',
          900: '#3A00BF',
        },
        // Cor Secundária - Azul Glow (#4A6CFF)
        secondary: {
          50: '#EEF1FF',
          100: '#DEE4FF',
          200: '#BDC9FF',
          300: '#536BD8',
          400: '#4058D6',
          500: '#4A6CFF',   // Azul Glow principal
          600: '#3A5CEF',
          700: '#2A4CDF',
          800: '#1A3CCF',
          900: '#0A2CBF',
        },
        // Cor de Destaque - Lilás Neon (#C084FF)
        accent: {
          50: '#FAF5FF',
          100: '#F5EBFF',
          200: '#EBD6FF',
          300: '#A469D4',
          400: '#8E45CC',
          500: '#C084FF',   // Lilás Neon principal
          600: '#B070EF',
          700: '#A060DF',
          800: '#9050CF',
          900: '#8040BF',
        },
        // Cor VIP - Dourado Suave (#E0C87A)
        vip: {
          50: '#FDF9F0',
          100: '#FCF3E0',
          200: '#F9E7C2',
          300: '#F5DBA3',
          400: '#EAD18C',
          500: '#E0C87A',   // Dourado Suave principal
          600: '#D4B860',
          700: '#C4A850',
          800: '#B49840',
          900: '#A48830',
        },
        // Cores de base Lumera
        lumera: {
          obsidian: 'rgb(var(--lumera-obsidian) / <alpha-value>)',
          luminoso: 'rgb(var(--lumera-luminoso) / <alpha-value>)',
          fumaca: 'rgb(var(--lumera-fumaca) / <alpha-value>)',
          surface: 'rgb(var(--lumera-surface) / <alpha-value>)',
          'surface-alt': 'rgb(var(--lumera-surface-alt) / <alpha-value>)',
          border: 'rgb(var(--lumera-border) / <alpha-value>)',
          divider: 'rgb(var(--lumera-divider) / <alpha-value>)',
          muted: 'rgb(var(--lumera-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(123, 46, 255, 0.08)',
        'card-hover': '0 4px 16px rgba(123, 46, 255, 0.15)',
        'glow': '0 0 20px rgba(123, 46, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(123, 46, 255, 0.4)',
        'festival': '0 0 15px rgba(123, 46, 255, 0.2), 0 0 30px rgba(74, 108, 255, 0.1)',
      },
      backgroundImage: {
        'gradient-lumera': 'linear-gradient(135deg, #7B2EFF 0%, #4A6CFF 100%)',
        'gradient-lumera-vertical': 'linear-gradient(180deg, #7B2EFF 0%, #4A6CFF 100%)',
        'gradient-festival': 'linear-gradient(135deg, #7B2EFF 0%, #C084FF 50%, #4A6CFF 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(123,46,255,0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(123,46,255,0.35)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-30px) scale(1.05)' },
        },
        'aurora': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'text-glow': {
          '0%, 100%': { textShadow: '0 0 20px rgba(123,46,255,0.3), 0 0 60px rgba(123,46,255,0.1)' },
          '50%': { textShadow: '0 0 30px rgba(123,46,255,0.5), 0 0 80px rgba(123,46,255,0.2)' },
        },
        'border-rotate': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'aurora': 'aurora 8s ease infinite',
        'text-glow': 'text-glow 3s ease-in-out infinite',
        'border-rotate': 'border-rotate 3s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
