/*
  Root React component of the frontend application. It is the main
  container of the UI. Other components can be  added inside it.
  In a React project, everything on the page is built from components, and 
  App.tsx is the top-level component that gets mounted into the HTML
*/

import React from "react";

// Import React Router utilities for navigation
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

// Import page components
import LandingPage from "./pages/LandingPage";
import Game from "./pages/GamePage";
import Tournament from "./pages/TournamentLobby";
import Friends from "./pages/Friends";
import Profile from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import background from "./assets/background.png";
import Exit from "./pages/Exit";
import NotFound from "./pages/NotFound";



// Import shared layout components
import Navbar from "./components/layout/Navbar";
// Translation
import { TranslationProvider } from "./shared/Translation";
import LanguageSync from "./shared/LanguageSync";

// Import AuthContext to manage user authentication state
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

// Layout wrapper component
// - Shows the Navbar unless user is on the LandingPage ("/")
// - Wraps page content inside <main>
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
const location = useLocation();
const { isLoggedIn } = useAuth(); // get login status

// Show navbar if user is logged in OR if not on landing page.
const showNavbar = isLoggedIn || location.pathname !== "/";

return (
        <div className="relative h-full"> {/* CHANGE MIN-H-SCREEN TO H-FULL */}
            {/* Background (unchanged) */}
            <div
                className="fixed inset-0 bg-black/50"
                style={{
                    //backgroundImage: `url(${background})`,
                    //backgroundSize: "cover",
                    //backgroundPosition: "center",
                    //backgroundAttachment: "fixed",
                }}
            />

            {/* Foreground content: h-full is now 100% of viewport height */}
            <div className="relative z-10 flex flex-col h-full p-6"> {/* CHANGE MIN-H-SCREEN TO H-FULL */}

                {showNavbar && (
                    <div className="mb-6">
                        <div className="rounded-xl overflow-hidden shadow-lg">
                            <Navbar />
                        </div>
                    </div>
                )}
                
                {/* Main area: MUST GROW to push the remaining space to the content */}
                <main className="flex-grow py-0"> 
                    {children}
                </main>
            </div>
        </div>
    );
};

//Protected routes means user must be logged in to access these routes
const protectedRoutes = [
  { path: "/game", element: <Game /> },
  { path: "/tournament", element: <Tournament /> },
  { path: "/friends", element: <Friends /> },
  { path: "/profile", element: <Profile /> },
  { path: "/settings", element: <SettingsPage /> },
];

// App component
// - Wraps everything in <Router> to enable client-side routing
// - Defines all application routes and maps them to page components
export default function App() {
  return (
    <AuthProvider>
		<Router>
			<TranslationProvider>
				<LanguageSync />
				<Layout>
					<Routes>
						<Route path="/" element={<LandingPage />} />
						<Route path="/exit" element={<Exit />} />
						{protectedRoutes.map(({ path, element }) => (
							<Route
								key={path}
								path={path}
								element={<ProtectedRoute>{element}</ProtectedRoute>}
							/>
						))}
						<Route path="*" element={<NotFound />} />
					</Routes>
				</Layout>
			</TranslationProvider>
		</Router>
	</AuthProvider>
	);
}
