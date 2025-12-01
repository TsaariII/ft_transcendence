import React, { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../shared/Translation";

const Navbar: React.FC = () => {
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const { t } = useTranslation();

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
		if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
			setOpen(false);
		}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<nav className="relative w-full bg-[#6C0E42]/10 backdrop-blur-md shadow-md text-[#FFFCC7] px-4 md:px-8 h-16 flex items-center z-50">
		{/* Home */}
		<Link
			to="/"
			className="font-cupcake text-medium sm:text-lg md:text-xl tracking-wider"
			style={{ textShadow: "-3px 0 #000, 3px 0 #000" }}
		>
			{t("nav.home")}
		</Link>

		{/* Desktop Menu */}
		<div className="font-cupcake hidden md:flex ml-auto gap-6">
			<Link to="/game" className="hover:opacity-80 transition-opacity">{t("nav.game")}</Link>
			<Link to="/tournament" className="hover:opacity-80 transition-opacity">{t("nav.tournament")}</Link>
			<Link to="/friends" className="hover:opacity-80 transition-opacity">{t("nav.friends")}</Link>
			<Link to="/profile" className="hover:opacity-80 transition-opacity">{t("nav.profile")}</Link>
			<Link to="/settings" className="hover:opacity-80 transition-opacity">{t("nav.settings")}</Link>
			<Link to="/exit" className="hover:opacity-80 transition-opacity">{t("nav.exit")}</Link>
		</div>

		{/* Mobile Hamburger Button */}
		<button
			className="ml-auto md:hidden p-2 hover:opacity-80 transition-opacity"
			onClick={() => setOpen(!open)}
			aria-label="Toggle navigation menu"
		>
			{open ? <X size={24} /> : <Menu size={24} />}
		</button>

		{/* Mobile Menu Dropdown */}
		<div
			ref={menuRef}
			className={`font-cupcake fixed top-16 left-0 w-full bg-[#6C0E42]/95 backdrop-blur-xl
				flex-col items-start gap-4 p-4 shadow-xl md:hidden z-50
				transition-all duration-300 ease-in-out
				${open ? "flex opacity-100 translate-y-0" : "hidden opacity-0 -translate-y-4"}`}
			>
			<Link to="/game" onClick={() => setOpen(false)} className="w-full hover:opacity-80 transition-opacity">{t("nav.game")}</Link>
			<Link to="/tournament" onClick={() => setOpen(false)} className="w-full hover:opacity-80 transition-opacity">{t("nav.tournament")}</Link>
			<Link to="/friends" onClick={() => setOpen(false)} className="w-full hover:opacity-80 transition-opacity">{t("nav.friends")}</Link>
			<Link to="/profile" onClick={() => setOpen(false)} className="w-full hover:opacity-80 transition-opacity">{t("nav.profile")}</Link>
			<Link to="/settings" onClick={() => setOpen(false)} className="w-full hover:opacity-80 transition-opacity">{t("nav.settings")}</Link>
			<Link to="/exit" onClick={() => setOpen(false)} className="w-full hover:opacity-80 transition-opacity">{t("nav.exit")}</Link>
		</div>
		</nav>
  );
};

export default Navbar;
