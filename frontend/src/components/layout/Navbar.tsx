import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../shared/Translation";
import { useRandomBorderRadius } from "../../hooks/useRandomBorderRadius";


const Navbar: React.FC = () => {
	const { t } = useTranslation();
	const borderRef = useRandomBorderRadius<HTMLDivElement>();

	// Dont remove translations for buttons!!
	return (
		<nav
			ref={borderRef}
			className="text-[#FFFCC7] sketch-border p-4 backdrop-blur-md shadow-md flex items-center gap-4"
		>
			<Link
				to="/"
				className="p-2 font-cupcake text-[#FFFCC7] text-xl tracking-wider"
				style={{ textShadow: `
					-3px 0 #000,
					3px 0 #000`
				}}
			>
				{t("nav.home")}
			</Link>
			<Link
				to="/game"
				className="p-2 font-cupcake text-xl tracking-wider"
				style={{ textShadow: `
					-3px 0 #000,
					3px 0 #000`
				}}
			>
				{t("nav.game")}
			</Link>
			<Link
				to="/tournament"
				className="p-2 font-cupcake text-xl tracking-wider"
				style={{ textShadow: `
					-3px 0 #000,
					3px 0 #000`
				}}
			>
				{t("nav.tournament")}
			</Link>
			<Link
				to="/friends"
				className="p-2 font-cupcake text-xl tracking-wider"
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
					className="p-2 font-cupcake text-xl tracking-wider"
					style={{ textShadow: `
						-3px 0 #000,
						3px 0 #000`
					}}
				>
					{t("nav.profile")}
				</Link>
				<Link
					to="/settings"
					className="p-2 font-cupcake text-xl tracking-wider"
					style={{ textShadow: `
						-3px 0 #000,
						3px 0 #000`
					}}
				>
					{t("nav.settings")}
				</Link>
				<Link
					to="/exit"
					className="p-2 font-cupcake text-xl tracking-wider"
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
