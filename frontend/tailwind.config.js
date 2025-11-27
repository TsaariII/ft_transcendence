/** @type {import('tailwindcss').Config} */     // Only for the IDE to enable auto-completion and type checking

// Tailwind CSS configuration file
module.exports = {
  content: [                    // "content" tells Tailwind which files to scan for class names
    "./index.html",             //  include the main HTML file
    "./src/**/*.{ts,tsx}"],     // include all TypeScript and TSX files in the src folder
  theme: {                      // allows customizing default design tokens (colors, spacing, fonts, etc.)
    extend: {
      fontFamily: {
        hand: ['Doodle', 'cursive'],
        heading: ['Heading'],
        body: ['Body'],
        cupcake: ['Cupcake']
      },
    },
  },
  plugins: [],                   // Tailwind plugins for additional utilities/components
};
