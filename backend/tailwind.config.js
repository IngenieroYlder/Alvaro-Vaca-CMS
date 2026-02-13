/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.hbs",
    "./public/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#006838",
        secondary: "#0D9A49",
        sunflower: "#D7DF23",
        accent: "#F89621",
        "background-light": "#F9FAFB",
        "background-dark": "#111827",
      },
      fontFamily: {
        display: ["Montserrat", "sans-serif"],
        body: ["Open Sans", "sans-serif"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
