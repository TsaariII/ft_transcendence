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
		className="sketch-border p-4 backdrop-blur-md shadow-md flex items-center gap-4"
	>
		<Link
			to="/"
			className="font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              style={{ textShadow: `
                  -3px 0 #000,
                  3px 0 #000,
                  0 3px #000,
                  0 -3px #000,
                  3px 3px #59322B,
                 -3px -3px #59322B`
               }}
		>
			{t("nav.home")}
		</Link>
		<Link
			to="/game"
			className="font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              style={{ textShadow: `
                  -3px 0 #000,
                  3px 0 #000,
                  0 3px #000,
                  0 -3px #000,
                  3px 3px #59322B,
                 -3px -3px #59322B`
               }}
		>
			{t("nav.game")}
		</Link>
		<Link
			to="/tournament"
			className="font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              style={{ textShadow: `
                  -3px 0 #000,
                  3px 0 #000,
                  0 3px #000,
                  0 -3px #000,
                  3px 3px #59322B,
                 -3px -3px #59322B`
               }}
		>
			{t("nav.tournament")}
		</Link>
		<Link
			to="/friends"
			className="font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              style={{ textShadow: `
                  -3px 0 #000,
                  3px 0 #000,
                  0 3px #000,
                  0 -3px #000,
                  3px 3px #59322B,
                 -3px -3px #59322B`
               }}
		>
			{t("nav.friends")}
		</Link>

		<div className="ml-auto flex gap-4">
			<Link
				to="/profile"
				className="font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              style={{ textShadow: `
                  -3px 0 #000,
                  3px 0 #000,
                  0 3px #000,
                  0 -3px #000,
                  3px 3px #59322B,
                 -3px -3px #59322B`
               }}
			>
				{t("nav.profile")}
			</Link>
			<Link
				to="/settings"
				className="font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              style={{ textShadow: `
                  -3px 0 #000,
                  3px 0 #000,
                  0 3px #000,
                  0 -3px #000,
                  3px 3px #59322B,
                 -3px -3px #59322B`
               }}
			>
				{t("nav.settings")}
			</Link>
			<Link
				to="/exit"
				className="font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              style={{ textShadow: `
                  -3px 0 #000,
                  3px 0 #000,
                  0 3px #000,
                  0 -3px #000,
                  3px 3px #59322B,
                 -3px -3px #59322B`
               }}
			>
				{t("nav.exit")}
			</Link>
		</div>
	</nav>
);
};

export default Navbar;
