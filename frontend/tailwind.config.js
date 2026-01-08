/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: 'var(--primary)',
                secondary: 'var(--secondary)',
                tertiary: 'var(--tertiary)',
                base: 'var(--base)',
                accent: 'var(--accent)',
            },
            spacing: {
                xs: 'var(--space-xs)',
                s: 'var(--space-s)',
                m: 'var(--space-m)',
                l: 'var(--space-l)',
                xl: 'var(--space-xl)',
                xxl: 'var(--space-xxl)',
                section: 'var(--space-section)',
            },
            fontSize: {
                h1: ['var(--h1)', { lineHeight: '1.1' }],
                h2: ['var(--h2)', { lineHeight: '1.2' }],
                h3: ['var(--h3)', { lineHeight: '1.3' }],
                h4: ['var(--h4)', { lineHeight: '1.4 text-m: var(--text-m)' }],
            },
            borderRadius: {
                DEFAULT: 'var(--radius)',
                s: 'var(--radius-s)',
                m: 'var(--radius-m)',
                l: 'var(--radius-l)',
            }
        },
    },
    plugins: [],
}
