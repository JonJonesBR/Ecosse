/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js",
    "./css/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors used in the application
        'panel-bg': '#1a1a2e',
        'panel-border': '#16213e',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
  // Safelist commonly used classes to prevent purging
  safelist: [
    'bg-green-600',
    'bg-green-700',
    'bg-yellow-600',
    'bg-yellow-700',
    'bg-red-600',
    'bg-red-700',
    'bg-blue-600',
    'bg-blue-700',
    'bg-purple-600',
    'bg-purple-700',
    'bg-indigo-600',
    'bg-indigo-700',
    'bg-slate-600',
    'bg-slate-700',
    'bg-gray-600',
    'bg-gray-700',
    'hover:bg-green-700',
    'hover:bg-yellow-700',
    'hover:bg-red-700',
    'hover:bg-blue-800',
    'hover:bg-purple-700',
    'hover:bg-indigo-700',
    'hover:bg-slate-700',
    'hover:bg-gray-700',
    'text-white',
    'text-gray-200',
    'text-gray-300',
    'text-gray-400',
    'text-xl',
    'text-3xl',
    'text-sm',
    'font-bold',
    'font-semibold',
    'font-medium',
    'mb-2',
    'mb-3',
    'mb-4',
    'mb-6',
    'flex',
    'flex-wrap',
    'justify-center',
    'justify-between',
    'items-center',
    'gap-3',
    'gap-4',
    'w-full',
    'hidden',
    'lg:hidden',
    'sm:inline',
    'px-3',
    'py-2',
    'drop-shadow-lg',
    'text-center',
    'selection:bg-indigo-700',
    'selection:text-white'
  ]
}