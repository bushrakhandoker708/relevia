/** @type {import('tailwindcss').Config} */

// Paper and crayon palette (November 2026 redesign).
// Paper, navy ink and sage come from a notebook; rose, lilac and marigold are crayon colours
// used for drawings and accents. Tailwind's own colour names (blue, purple, pink...) are
// remapped onto these scales so that every page, including the long technique pages,
// moves to the same palette without rewriting each class. Red is left alone: it still
// means danger or error.
const ink = { 50: '#F1F4F9', 100: '#E1E8F2', 200: '#C5D2E5', 300: '#9DB2D1', 400: '#7290BB', 500: '#4F70A3', 600: '#3B5785', 700: '#2F466B', 800: '#283A57', 900: '#23324A', 950: '#1A2638' };
const sage = { 50: '#F1F5F1', 100: '#E1EAE2', 200: '#C6D6C8', 300: '#A2BCA6', 400: '#7F9F85', 500: '#5F7F68', 600: '#4C6854', 700: '#3F5546', 800: '#34463A', 900: '#2B3A31', 950: '#1F2A23' };
const lilac = { 50: '#F5F3FC', 100: '#EBE7F9', 200: '#D8D0F2', 300: '#BDB0E8', 400: '#9B8CE0', 500: '#7F6DCE', 600: '#6A58B5', 700: '#574893', 800: '#473C76', 900: '#3B3360', 950: '#2A2446' };
const rose = { 50: '#FDF2F4', 100: '#FBE4E9', 200: '#F6C9D3', 300: '#EFA4B4', 400: '#E7809A', 500: '#E2647F', 600: '#C94B68', 700: '#A83D56', 800: '#8B3449', 900: '#742F40', 950: '#4F1E2A' };
const marigold = { 50: '#FEF9EC', 100: '#FDF0CF', 200: '#FAE09E', 300: '#F6CD6A', 400: '#F2C14E', 500: '#E3A52F', 600: '#C58423', 700: '#A1651F', 800: '#83501F', 900: '#6C421D', 950: '#432811' };
const paper = { 50: '#F8F9F4', 100: '#EEF0E9', 200: '#E0E4DC', 300: '#C9CFC6', 400: '#9EA6A4', 500: '#737D86', 600: '#4F5D73', 700: '#3D4A5E', 800: '#2E3A4F', 900: '#23324A', 950: '#1A2638' };

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: ink,
        secondary: sage,
        accent: lilac,
        neutral: paper,
        gray: paper, slate: paper, zinc: paper, stone: paper,
        blue: ink, indigo: ink, sky: ink, cyan: ink,
        green: sage, emerald: sage, teal: sage, lime: sage,
        purple: lilac, violet: lilac, fuchsia: lilac,
        pink: rose, rose,
        yellow: marigold, amber: marigold, orange: marigold,
        ink, sage, lilac, marigold,
        sheet: '#F8F9F4',
        rule: '#C9D3DE',
        margin: '#E3A7A1',
        crayon: { blue: '#3E6FD8', sun: '#F4B63A', leaf: '#4E9E6A', rose: '#E2647F', lilac: '#9B8CE0', bark: '#8A5A3B' },
        white: '#FFFFFF',
        black: '#000000',
      },
      fontFamily: {
        heading: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
        body: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
        sans: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
        handwritten: ['Caveat', 'cursive'],
        pencil: ['Kalam', 'Caveat', 'cursive'],
      },
      boxShadow: {
        soft: '0 1px 0 #D9DDD2, 0 14px 32px -22px rgba(35, 50, 74, 0.45)',
        page: '0 1px 0 #D9DDD2, 0 18px 40px -22px rgba(35, 50, 74, 0.45)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        gentlePulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 2s ease-in-out',
        gentlePulse: 'gentlePulse 3s infinite',
      },
    },
  },
  plugins: [],
}
