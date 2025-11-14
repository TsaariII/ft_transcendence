import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../shared/Translation";

const Navbar: React.FC = () => {
const { t } = useTranslation();

// Dont remove translations for buttons!!
return (
	<nav className="btn-handdrawn p-4 bg-black backdrop-blur-md shadow-md flex items-center gap-4">
	<Link
		to="/"
		className=" font-hand text-lg px-3 py-1 rounded hover:text-indigo-400 transition-colors"
	>
		{t("nav.home")}
	</Link>
	<Link
		to="/game"
		className="font-hand text-lg px-3 py-1 rounded hover:text-indigo-400 transition-colors"
	>
		{t("nav.game")}
	</Link>
	<Link
		to="/tournament"
		className="font-hand text-lg px-3 py-1 rounded hover:text-indigo-400 transition-colors"
	>
		{t("nav.tournament")}
	</Link>
	<Link
		to="/friends"
		className="font-hand text-lg px-3 py-1 rounded hover:text-indigo-400 transition-colors"
	>
		{t("nav.friends")}
	</Link>

	<div className="ml-auto flex gap-4">
		<Link
		to="/profile"
		className="font-hand text-lg px-3 py-1 rounded hover:text-indigo-400 transition-colors"
		>
		{t("nav.profile")}
		</Link>
		<Link
		to="/settings"
		className="font-hand text-lg px-3 py-1 rounded hover:text-indigo-400 transition-colors"
		>
		{t("nav.settings")}
		</Link>
		<Link
		to="/exit"
		className="font-hand text-lg px-3 py-1 rounded hover:text-indigo-400 transition-colors"
		>
		{t("nav.exit")}
		</Link>
	</div>
	</nav>
);
};

export default Navbar;
