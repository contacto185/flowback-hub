/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tema crema actual del proyecto
        cream:    '#faf6f1',
        ink:      '#2A201A',        // texto principal
        line:     'rgba(42,32,26,.08)',
        card:     '#FFFFFF',
        // Acentos (heredados de la app vanilla)
        accent: {
          orange: '#F57C00',
          warm:   '#FFB74D',
          blue:   '#38BDF8',
          purple: '#a78bfa',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        // Gradient naranja → azul usado en CTAs y headings de marca
        'grad-brand': 'linear-gradient(135deg, #F57C00 0%, #38BDF8 100%)',
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(42,32,26,.05), 0 1px 2px rgba(42,32,26,.04)',
        'card-hover': '0 4px 12px rgba(42,32,26,.08), 0 2px 4px rgba(42,32,26,.05)',
      },
    },
  },
  plugins: [],
};
