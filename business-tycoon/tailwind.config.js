/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary color palette
        primary: {
          100: '#e3f2fd',
          200: '#bbdefb',
          300: '#90caf9',
          400: '#64b5f6',
          500: '#42a5f5',
          600: '#2196f3',
          700: '#1e88e5',
          800: '#1976d2',
          900: '#1565c0'
        },
        // Secondary color palette - Teal
        secondary: {
          100: '#e0f2f1',
          200: '#b2dfdb',
          300: '#80cbc4',
          400: '#4db6ac',
          500: '#26a69a',
          600: '#009688',
          700: '#00897b',
          800: '#00796b',
          900: '#00695c'
        },
        // Success color palette - Green
        success: {
          100: '#e8f5e9',
          200: '#c8e6c9',
          300: '#a5d6a7',
          400: '#81c784',
          500: '#66bb6a',
          600: '#4caf50',
          700: '#43a047',
          800: '#388e3c',
          900: '#2e7d32'
        },
        // Warning color palette - Amber
        warning: {
          100: '#fff8e1',
          200: '#ffecb3',
          300: '#ffe082',
          400: '#ffd54f',
          500: '#ffca28',
          600: '#ffc107',
          700: '#ffb300',
          800: '#ffa000',
          900: '#ff8f00'
        },
        // Danger color palette - Red
        danger: {
          100: '#ffebee',
          200: '#ffcdd2',
          300: '#ef9a9a',
          400: '#e57373',
          500: '#ef5350',
          600: '#f44336',
          700: '#e53935',
          800: '#d32f2f',
          900: '#c62828'
        },
        // Neutral color palette
        neutral: {
          100: '#f5f7fa',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#6c757d',
          700: '#495057',
          800: '#343a40',
          900: '#212529'
        },
        // Background Colors
        'bg-primary': '#f5f7fa',
        'bg-secondary': '#ffffff',
        'bg-tertiary': '#e9ecef',
        // Text Colors
        'text-primary': '#212529',
        'text-secondary': '#495057',
        'text-tertiary': '#6c757d',
        'text-light': '#ffffff'
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif']
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px'
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '20px',
        '2xl': '9999px' // For pill shapes
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 16px rgba(0, 0, 0, 0.1)',
        'xl': '0 12px 24px rgba(0, 0, 0, 0.12)'
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'md': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '30px',
        '2xs': '0.625rem' // 10px, smaller than xs (12px)
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700'
      },
      transitionDuration: {
        'fast': '200ms',
        'medium': '300ms',
        'slow': '500ms'
      },
      zIndex: {
        'base': '1',
        'above': '10',
        'high': '100',
        'modal': '1000',
        'top': '9999'
      },
      maxWidth: {
        'container': '900px'
      },
      height: {
        'header': '60px'
      },
      screens: {
        'xs': '480px',
      },
    }
  },
  plugins: [],
} 