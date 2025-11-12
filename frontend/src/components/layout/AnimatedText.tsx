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
  const textRef = useRef<SVGTextElement>(null);

  useEffect(() => {
	const textEl = textRef.current;
	if (!textEl) return;

	const length = textEl.getComputedTextLength();
	textEl.style.strokeDasharray = `${length}`;
	textEl.style.strokeDashoffset = `${length}`;

	textEl.animate(
	  [
		{ strokeDashoffset: length, opacity: 0 },
		{ strokeDashoffset: 0, opacity: 1 },
	  ],
	  {
		duration,
		easing: "ease-in-out",
		fill: "forwards",
	  }
	);
  }, [text, duration]);

  return (
	<div className={`flex justify-center ${className}`}>
	  <svg
		viewBox="0 0 2200 600"
		className="w-full max-w-[2000px] h-auto"
	  >
		<text
		  ref={textRef}
		  x="50%"
		  y="50%"
		  textAnchor="middle"
		  className="fill-transparent font-bold"
		  style={{
			fontSize: "clamp(8rem, 20vw, 18rem)",
            fontFamily: "sans-serif",
            dominantBaseline: "middle",
            stroke: strokeColor,
            strokeWidth,
		  }}
		>
		  {text}
		</text>
	  </svg>
	</div>
  );
};

