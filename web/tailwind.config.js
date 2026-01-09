/** @type {import('tailwindcss').Config} */

// ========================================
// LUMERA - Identidade Visual
// "Uma nova era de brilho"
// ========================================
const lumeraColors = {
  roxoLumera: '#7B2EFF',      // Primária - moderno, premium, noturno
  azulGlow: '#4A6CFF',        // Secundária - brilho, tecnologia
  pretoObsidian: '#0E0E0F',   // Elegância, contraste
  brancoLuminoso: '#F8F8FF',  // Leveza, minimalismo
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
          300: '#C2A3FF',
          400: '#9E5CFF',
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
          300: '#9CAEFF',
          400: '#7B93FF',
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
          300: '#E0C2FF',
          400: '#D0A3FF',
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
          obsidian: '#0E0E0F',     // Preto Obsidian
          luminoso: '#F8F8FF',     // Branco Luminoso
          fumaca: '#2A2A2E',       // Cinza Fumaça
          surface: '#F5F3FF',      // Superfície clara (com tom roxo)
          border: '#E0D4FF',       // Bordas (com tom roxo)
          divider: '#F0EAFF',      // Divisores
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
      },
      backgroundImage: {
        'gradient-lumera': 'linear-gradient(135deg, #7B2EFF 0%, #4A6CFF 100%)',
        'gradient-lumera-vertical': 'linear-gradient(180deg, #7B2EFF 0%, #4A6CFF 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
