import React, { useState} from "react";
import AnimatedText from "../layout/AnimatedText";

interface DoodleBoxProps {
	icon?: React.ReactNode; // icon component or image
	imageSrc?: string; // optional imported image
	onClick?: () => void;
	width?: string; // tailwind width class e.g., "w-32"
	height?: string; // tailwind height class e.g., "h-32"
	rotate?: string; // tailwind rotate class e.g., "rotate-2"
	borderRadius?: string; // tailwind rounded class or custom e.g., "rounded-xl"
	hoverText?: string; // text to animate on hover
	strokeColor?: string; // color of the animated text stroke
	strokeWidth?: number;
	animationDuration?: number; // duration of the text animation
}

const DoodleBox: React.FC<DoodleBoxProps> = ({
	icon,
	imageSrc,
	onClick,
	width = "w-56",
	height = "h-56",
	rotate = "rotate-0",
	borderRadius = "rounded-xl",
	hoverText,
	strokeColor = "yellow",
	strokeWidth = 2,
	animationDuration = 2000,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	
	return (
		<button
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={`group ${width} ${height} p-0 ${borderRadius} ${rotate}
				flex flex-col items-center justify-center`}
			>
			{imageSrc && (
				<img
				src={imageSrc}
				alt=""
				className="w-full h-full object-cover"
				/>
			)}
			{icon && React.isValidElement(icon) ? icon : icon}

			{/* Show AnimatedText on hover */}
			{hoverText && isHovered && (
				<div className="mt-2 w-full">
					<AnimatedText
						text={hoverText}
						strokeColor={strokeColor}
						strokeWidth={strokeWidth}
						duration={animationDuration}
						className="w-full"
					/>
				</div>
			)}
		</button>
	);
};

export default DoodleBox;
