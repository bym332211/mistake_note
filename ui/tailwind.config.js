

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#06B6D4',
        tertiary: '#10B981',
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
        'text-primary': '#1F2937',
        'text-secondary': '#6B7280',
        'bg-light': '#F9FAFB',
        'card-bg': '#FFFFFF',
        'border-light': '#E5E7EB'
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }
    }
  },
  plugins: [],
}

