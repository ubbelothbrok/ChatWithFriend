/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    light: '#6366f1',
                    DEFAULT: '#4f46e5',
                    dark: '#4338ca',
                },
                sidebar: {
                    DEFAULT: '#f8fafc',
                    active: '#e2e8f0'
                }
            }
        },
    },
    plugins: [],
}
