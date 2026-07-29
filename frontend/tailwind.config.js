/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e7f1ff",
          100: "#cfe2ff",
          200: "#9ec5fe",
          300: "#6ea8fe",
          400: "#3d8bfd",
          500: "#0d6efd", // Professional Blue Accent
          600: "#0b5ed7",
          700: "#0a58ca",
          800: "#084298",
          900: "#052c65",
        },
        charcoal: {
          DEFAULT: "#212529",
          muted: "#495057",
          light: "#6c757d",
        },
        offwhite: "#f8f9fa",
        status: {
          present: "#198754",
          late: "#ffc107",
          halfDay: "#fd7e14",
          absent: "#dc3545",
          remote: "#6f42c1",
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 20px -5px rgba(13, 110, 253, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
