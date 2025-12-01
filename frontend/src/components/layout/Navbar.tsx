import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../shared/Translation";

const Navbar: React.FC = () => {
	const { t } = useTranslation();

	// Dont remove translations for buttons!!
	return (
		<nav
			className="text-[#FFFCC7] sketch-border h-16 p-2 sm:p-4 backdrop-blur-md 
					shadow-md flex items-center gap-2 sm:gap-4"
		>
			<Link
				to="/"
				className="p-1 sm:p-2 font-cupcake text-sm sm:text-base md:text-lg tracking-wider"
				style={{ textShadow: `
					-3px 0 #000,
					3px 0 #000`
				}}
			>
				{t("nav.home")}
			</Link>
			<Link
				to="/game"
				className="p-1 font-cupcake text-sm sm:text-base md:text-lg tracking-wider"
				style={{ textShadow: `
					-3px 0 #000,
					3px 0 #000`
				}}
			>
				{t("nav.game")}
			</Link>
			<Link
				to="/tournament"
				className="p-1 font-cupcake text-sm sm:text-base md:text-lg tracking-wider"
				style={{ textShadow: `
					-3px 0 #000,
					3px 0 #000`
				}}
			>
				{t("nav.tournament")}
			</Link>
			<Link
				to="/friends"
				className="p-1 font-cupcake text-sm sm:text-base md:text-lg tracking-wider"
				style={{ textShadow: `
					-3px 0 #000,
					3px 0 #000`
				}}
			>
				{t("nav.friends")}
			</Link>

			<div className="ml-auto flex gap-4">
				<Link
					to="/profile"
					className="p-1 font-cupcake text-sm sm:text-base md:text-lg tracking-wider"
					style={{ textShadow: `
						-3px 0 #000,
						3px 0 #000`
					}}
				>
					{t("nav.profile")}
				</Link>
				<Link
					to="/settings"
					className="p-1 font-cupcake text-sm sm:text-base md:text-lg tracking-wider"
					style={{ textShadow: `
						-3px 0 #000,
						3px 0 #000`
					}}
				>
					{t("nav.settings")}
				</Link>
				<Link
					to="/exit"
					className="p-1 font-cupcake text-sm sm:text-base md:text-lg tracking-wider"
					style={{ textShadow: `
						-3px 0 #000,
						3px 0 #000`
					}}
				>
					{t("nav.exit")}
				</Link>
			</div>
		</nav>
	);
};

export default Navbar;
