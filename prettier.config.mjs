/** @type {import("prettier").Config} */
const config = {
  semi: false,
  singleQuote: false,
  trailingComma: "es5",
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",
  endOfLine: "lf",

  plugins: ["prettier-plugin-tailwindcss"],

  /*
   * Necessário para o plugin considerar o tema do Tailwind v4.
   */
  tailwindStylesheet: "./app/globals.css",

  tailwindFunctions: ["cn", "cva", "clsx"],
}

export default config