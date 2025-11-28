import React, { useState } from "react";

interface SketchyButtonProps {
	children: React.ReactNode;
	variant?: "striped" | "double-line" | "3d";
	className?: string;
	bg?: string;        // base fill color
	hoverBg?: string;   // hover fill color
	onClick?: () => void;
}

const SketchyButton: React.FC<SketchyButtonProps> = ({
	children,
	variant = "striped",
	className = "",
	bg = "#ffffff",
	hoverBg = "#e5e5e5",
	onClick,
}) => {
	const [isHovered, setIsHovered] = useState(false);

	// Fill color depends on hover
	const fillColor = isHovered ? hoverBg : bg;

	const baseStyles = `
		relative inline-flex items-center justify-center px-6 py-3
		font-medium cursor-pointer transition-transform active:scale-95
		font-body text-sm
		${className}
	`;

	// Common rectangle for all variants
	const baseRect = (
		<rect
			x="6"
			y="2"
			width="90"
			height="32"
			rx="6"
			ry="8"
			fill={fillColor}
			stroke="white"
			strokeWidth="1.75"
		/>
	);

	if (variant === "shadow") {
		return (
			<button
				onClick={onClick}
				className={baseStyles}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				style={{
					background: fillColor,
					borderRadius: "10px",
					boxShadow: `
						2px 2px 0px 0px #000,
						4px 4px 0px 0px #000,
						-1px -1px 0px 0px #000 inset
					`,
					border: "2px solid #FFFCC7",
				}}
			>
				{children}
			</button>
		);
	}

	if (variant === "striped") {
		return (
			<button 
				className={baseStyles}
				style={{ outline: "none" }}
				onClick={onClick}
			>
				<svg
					className="absolute inset-0 w-full h-full"
					viewBox="0 0 100 40"
					preserveAspectRatio="none"
				>
				<defs>
					<pattern
						id="stripePattern"
						width="2"
						height="2"
						patternUnits="userSpaceOnUse"
						patternTransform="rotate(47)"
					>
						<line x1="0" y1="0" x2="0" y2="4" stroke="#000" strokeWidth="1.25" />
					</pattern>
				</defs>

				{/* Base rectangle */}
				{baseRect}

				{/* Striped band between rectangle and 3D lines */}
				<path
					d="M 6 34 L 6 4 L 3 8 L 3 32 Q 3 37 18 37 L 92 37 L 92 34 Z"
					fill="url(#stripePattern)"
					opacity="0.9"
				/>

				{/* 3D shadow lines */}
				<path
					d="M 3 9 L 3 30 Q 3 37 18 37 L 90 37"
					fill="none"
					stroke="white"
					strokeWidth="1.25"
					strokeLinecap="round"
				/>
				</svg>
				
				<span className="relative z-10">{children}</span>
			</button>
		);
	}

	if (variant === "double-line") {
		return (
			<button className={baseStyles} style={{ outline: "none" }} onClick={onClick}>
				<svg
					className="absolute inset-0 w-full h-full"
					viewBox="0 0 100 40"
					preserveAspectRatio="none">
					{baseRect}
					{/* Inner line */}
					<rect
						x="8.5"
						y="5"
						width="85"
						height="26"
						rx="6"
						ry="8"
						fill="none"
						stroke="white"
						strokeWidth="1.25"
					/>
				</svg>
				<span className="relative z-10">{children}</span>
			</button>
		);
	}

	if (variant === "3d") {
		return (
			<button className={baseStyles} style={{ outline: "none" }} onClick={onClick}>
				<svg
					className="absolute inset-0 w-full h-full"
					viewBox="0 0 100 40"
					preserveAspectRatio="none"
				>
					{baseRect}
					{/* Left & bottom 3D lines */}
					<path
						d="M 3 8 L 3 30 Q 3 37 18 37 L 90 37"
						fill="none"
						stroke="white"
						strokeWidth="1.25"
						strokeLinecap="round"
					/>
				</svg>
				<span className="relative z-10">{children}</span>
			</button>
		);
	}

	return null;
};

export default SketchyButton;
