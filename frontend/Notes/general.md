
# General info

## Frameworks/tools used:

- React → builds and manages the UI
- TypeScript → ensures data structures (payloads, props, game state) are consistent
- Tailwind → makes the UI look good with fast, consistent styling
- Vite → powers everything (compiles TS + React, injects Tailwind, serves in dev, bundles in prod)

### React
- JavaScript library for building user interfaces
- It controls what the user sees and updates it efficiently when the app state changes
- With it it's possible to build a web app as small reusable components and React then updates the browser whenever the data changes
    - Component-based UI → UI by combining small components
    - Virtual DOM → Instead of reloading the whole page, React updates just the part of the screen that changed
    - State management → Components can store and update data (e.g. useState)
    - Props → Pass data between components like function arguments
    - Hooks → React functions like useState, useEffect to handle state and side effects

### TypeScript
- Enhanced JavaScript
- Browsers can’t run TypeScript directly → tools like Vite need to compile it to plain JavaScript
- It requires types for variables and functions
- Let's you define shapes of objects and APIs (interface User { id: string; name: string; }).
- Compile-time error checking → Catches mistakes before running the code

### Tailwind CSS
- Instead of writing custom CSS classes, you can compose small utility classes directly in JSX/HTML (e.g., bg-black text-white p-4 rounded-xl).
- Pre-built utility classes → flex, grid, bg-blue-500, rounded-lg, etc.
- Customization → A tailwind.config.js file to define the theme (colors, fonts, spacing).

### Vite
- Vite is a build tool and development server
- Development server and instand reload
    - When you run ```npm run dev```, Vite starts a local web server
    - It serves the index.html and dynamically loads the React + TypeScript code
    - When you change a file, Vite updates the browser instantly
- TypeScript & JSX/TSX support
    - Browsers don’t understand Typescript and React JSX/TSX natively → Vite compiles/transforms it into   
    plain JavaScript that the browser understands
- Tailwind integration
    - Vite processes CSS with PostCSS (which Tailwind needs)
    - It watches for changes in Tailwind classes and regenerates styles immediately
- Bundle for production
    - When you run ```npm run build```, Vite bundles the whole app and optimizes it

## Purpose of each file

### index.html
- Entry point of the single page application (SPA). Browsers load this file first
- It doesn’t contain any app logic itself, but sets up the environment where React will take over
- It contains a single empty ```<div id="root"></div>``` which acts as the mount point for the React app
- All rendering is done by React inside this root div (React controls the DOM from here)

- What actually happens at runtime:
    - Browser loads this file
    - The script specified in the file is executed
    - main.tsx finds the #root div and mounts the React app into it
    - From that point, React controls the DOM and renders the SPA pages dynamically

### main.tsx
- Entry point for the React application
- It renders the ```<App />``` component into the #root div defined in index.html
- It loads global CSS/Tailwind styles so they apply everywhere
- In development mode, it starts Mock Service Worker (MSW) to simulate backend API responses

### app.tsx
- Main root component of the SPA
- Controls navigation & layout → It decides which page component is shown based on the current URL
- Sets up React router to allow navigation between different pages without reloading the whole site
- Wraps pages in a layout that adds a Navbar on all pages except the landing page
- Defines all the routes for the application

### package.json
- Defines dependencies, scripts, and metadata for the project
- Includes:
    - Project name, version, description
    - List of dependencies (libraries the app needs)
    - List of devDependencies (tools needed only for development)
    - Scripts like npm run dev, npm run build, npm run test

```
{
  "name": "frontend",               // project name
  "version": "0.1.0",               // project version
  "private": true,                  // prevents accidental publishing to npm registry

  "scripts": {                      // CLI commands that can be run with 'npm run <script>'
    "dev": "vite",                  // Starts Vite dev server (fast reload)
    "build": "vite build",          // Builds optimized production-ready files
    "preview": "vite preview"       // Gives built files locally for testing
  },

  "dependencies": {                 // Libraries required for the app to run
    "react": "^18.2.0",             // Core React library (UI components)
    "react-dom": "^18.2.0",         // React DOM renderer (mount React into the browser DOM)
    "react-router-dom": "^7.8.2"    // Routing library (navigation between pages in SPA)
  },

  "devDependencies": {                      // Tools needed only during development
    "@types/react": "^19.1.11",             // TS type definitions for React
    "@types/react-dom": "^19.1.7",          // TS type definitions for ReactDOM
    "@types/react-router-dom": "^5.3.3",    // TS types for react-router-dom  IS THIS NEEDED???
    "@vitejs/plugin-react": "^4.0.0",       // Vite plugin for React (JSX/TSX fast refresh support)
    "autoprefixer": "^10.4.21",             // PostCSS plugin to auto-add CSS vendor prefixes
    "msw": "^2.10.5",                       // Mock Service Worker (API mocking in development/tests)
    "postcss": "^8.5.6",                    // CSS processor (used with Tailwind + Autoprefixer)
    "tailwindcss": "^3.4.17",               // TailwindCSS framework
    "typescript": "^5.2.0",                 // TypeScript compiler
    "vite": "^5.0.0"                        // Vite build tool
  },

  "msw": {                                   // Extra config for Mock Service Worker
    "workerDirectory": [                     // Where the service worker script will be generated
      "public"
    ]
  }
}
```

### package-lock.json
- Ensures that builds can be reproduced by locking the exact versions of every installed dependency
- Automatically generated when you run npm install
- package.json says what dependencies are needed and package-lock.json locks down exact versions so everyone on the project installs the same thing

### tailwind.config.js
- Configures Tailwind CSS for the React + TypeScript project
- Teels where to look for CSS class names in the project
- Allows customizing default theme values (colors, spacing, fonts) or adding plugins
- Ensures Tailwind utilities work correctly in the .tsx components

### postcss.config.js
- Configures PostCSS, the tool that processes the CSS
- Tells the build system to use Tailwind to generate CSS from classes and to use Autoprefixer to make CSS compatible across different browsers

### tsconfig.json
- Configures the TypeScript compiler for the project
- Ensures that TypeScript understands modern JavaScript, React JSX, and browser APIs
- Enables strict type checking, which helps catch bugs at compile time
- Defines what is compiled

```
{
  "compilerOptions": {   
    "target": "ESNext",                              // Target version of JavaScript output
    "module": "ESNext",                              // Module system used for imports/exports
    "lib": ["DOM", "ESNext"],                        // Libraries to include for type checking
    "jsx": "react-jsx",                              // JSX transformation method (React 17+ automatic JSX runtime)
    "strict": true,                                  // Enable all strict type-checking options
    "moduleResolution": "Node",                      // Module resolution strategy (Node.js style)
    "esModuleInterop": true,                         // Enables interop between CommonJS and ES modules
    "skipLibCheck": true,                            // Skip type checking for all declaration files (*.d.ts)
    "types": ["vite/client", "some-other-global-lib"] 
  },                                                  // Additional global type definitions
  "include": ["src"]                                  // Which files/folders TypeScript should include in compilation
}
```

### vite.config.ts
- main configuration file for Vite
- Adds React plugin to handle JSX/TSX compilation and enable fast refresh during development
- Sets the development server to utomatically open the browser on port 5173
- Defines production build output folder (dist)

### vite-env.d.ts
- TypeScript declaration file for Vite-specific features
- Usually auto-generated by Vite, and ensures no TypeScript errors when using environment variables
- Tells TypeScript about the types provided by Vite at runtime
- The triple-slash directive (`/// <reference ... />`) imports type definitions
from the 'vite/client' package

### globals.css
- Acts as the global CSS entry point for the application
- Pulls in all of Tailwind’s CSS layers:
    - Base → default resets and typography
    - Components → pre-built reusable component styles
    - Utilities → all utility classes used in JSX (bg-black, text-white, p-6, etc.)
- Imported once in main.tsx so styles are available throughout the entire app

## Folders

### Assets
- Contains static files like images, fonts, icons etc.
    - Avatars
    - Images for the game or landing page
    - Icons for buttons (friend request, tournament trophy)\

### Components
- Contains reusable React components that aren’t full pages

#### Game
- ChooseGameMode.tsx
- GameSettings.tsx
- MiniLogin.tsx

#### Layout
- Navbar.tsx → navigation bar used on multiple pages
- ArcadeFrame.tsx → Purple frame used all all pages
- etc.

#### Profile
- PlayerProfileModal.tsx → Other player's profile component

#### Tournament
- PlayerList.tsx → component for adding players to tournament
- TournamentBracket.tsx → shows tournament matches, buttons for playing them and the winner
- TournamentSetup.tsx → API calls for adding and removing players to/ from tournament

#### UI
- Button.tsx → custom styled button
- DoodleButton.tsx  → Doodle that works as a button with text appearing when hovered
- Modal.tsx → Form/dialog for signing in and registering
- SketchyButton.tsx → selection of custom buttons (only shadow variant is really used)

### Context
  - AuthContext.tsx → stores the profile data of player and centrally fetches whenever there are changes

### Mocks
- Mock data and mock service workers for development/testing
  - browser.ts → sets up Mock Service Worker (MSW)
  - handlers.ts → defines fake API responses for login, game state, leaderboard

### Pages
- Components that correspond to full pages/routes
  - Exit.tsx → shows exit button and related messages
  - Friends.tsx → friends list and search field for adding friends
  - GamePage.tsx → local Pong game 
  - LandingPage.tsx → login/register modals and links to key pages
  - NotFound.tsx → 404 page not found
  - ProfilePage.tsx → profile, stats and match history
  - Settings.tsx → options for changing language, username, password, enabling 2FA, deleting profile
  - TournamentLobby.tsx → tournament registration & matchmaking

### Styles
- Global CSS, Tailwind imports or other styling files
  - globals.css

### Types
- TypeScript interfaces
    - Tournament.ts → Tournament, Match, Bracket

### Utils
- Helper functions or small utilities
    - apiFetch.ts → most API calls go through this. It catches 401 (token expired error) and handles logout