import { useEffect, useRef } from "react";

interface AnimatedTextProps {
	text?: string;
	strokeColor?: string;
	strokeWidth?: number;
	duration?: number;
	className?: string;
}

export default function AnimatedText({
	text = "PONG",
	strokeColor = "white",
	strokeWidth = 2,
	duration = 2000,
	className = "",
}: AnimatedTextProps) {
	if (!text) return null;

	const letters = text.split("");
	const letterDuration = duration / letters.length;

	return (
		<div className={`flex justify-center ${className} font-hand text-xl`}
			style={{ whiteSpace: "pre" }}
		>
			{letters.map((char, i) => (
				<span
					key={i}
					style={{
						color: strokeColor,
						opacity: 0,
						display: "inline-block",
						animation: `writeLetter ${letterDuration}ms ease forwards`,
						animationDelay: `${i * letterDuration}ms`,
					}}
					>
						{char}
				</span>
		))}

			<style> 
				{`
					@keyframes writeLetter {
					0% {
						opacity: 0;
						transform: translateY(1em);
					}
					100% {
						opacity: 1;
						transform: translateY(0);
					}}
				`}
			</style>
		</div>
	);
}

