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
import collection from "./assets/doodles/collection.png";
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
		<div className="relative h-full">
			{/* Repeating Background */}
			<div
				className="fixed inset-0"
				style={{
					backgroundImage: `url(${collection})`,
					backgroundRepeat: "repeat",       // repeat the image
					backgroundSize: "150px 150px",           // keeps original size
					backgroundPosition: "top left",   // optional start position
					backgroundAttachment: "fixed",    // stays fixed while scrolling
					backgroundBlendMode: "overlay",   // optional overlay
					backgroundColor: "rgba(77, 163, 148)",
				}}
			/>

			{/* Foreground content */}
			<div className="relative z-10 flex flex-col h-full p-6">
				{showNavbar && (
					<div className="mb-6">
						<div className="rounded-xl overflow-hidden shadow-lg">
							<Navbar />
						</div>
					</div>
				)}

				{/* Main content area */}
				<main className="flex-grow py-0">{children}</main>
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
