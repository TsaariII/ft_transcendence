import React from "react";

interface SketchyPanelProps {
	children?: React.ReactNode;
	className?: string;
	bg?: string;
	stroke?: string;
	padding?: string;
	borderRadius?: string;
}

const SketchyPanel: React.FC<SketchyPanelProps> = ({
	children,
	className = "",
	bg = "#6C0E42",
	stroke = "#FFFCC7",
	padding = "1rem",
	borderRadius = "45x 50px 48px 52px", // curved corners
}) => {
	return (
		<div
			className={`relative ${className}`}
			style={{
				// Base colors
				background: bg,
				border: `3px solid ${stroke}`,
				borderRadius,

				// Outer shadow
				boxShadow: `
					inset 0 0 3px rgba(0,0,0,0.6),   /* inner dark bevel */
					3px 3px 0 rgba(89,50,43,0.9),    /* exterior brown drop shadow */
					0 0 10px rgba(255,252,199,0.5)    /* soft ambient glow */
				`,

				padding,
			}}
		>

			{/* Inner bezel line */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					border: `0.5px solid #333`,
					borderRadius: `calc(${borderRadius} - 2px)`,
					margin: "10px",
					boxShadow: `
						inset 0 0 40px rgba(255,252,199,0.4) /* warm inner glow */
					`,
				}}
			/>

			{/* Radial glow*/}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background:
						"radial-gradient(ellipse at center, rgba(85,255,170,0.05) 0%, transparent 70%)",
				}}
			/>

			{/* Content */}
			<div className="relative z-10">{children}</div>
		</div>
	);
};

export default SketchyPanel;
