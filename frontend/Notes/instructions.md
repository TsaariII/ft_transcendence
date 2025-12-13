# How to test frontend without container and backend

1. If you don't have Node.js, install it (with npm included)

2. Install dependencies
`npm install`

3. Initialize MSW, i.e. set up service workers (mock responses to mimic backend responses)
`npx msw init public/ --save`

4. Run development server
`npm run dev`

5. Open app in Firefox  
http://localhost:5173.

6. Now when changes are made to the code, they are immediately reflected in the browser

