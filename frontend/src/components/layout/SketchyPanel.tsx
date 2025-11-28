import React from "react";

interface SketchyPanelProps {
  children?: React.ReactNode;
  className?: string;
  bg?: string;     // fill color
  stroke?: string; // border color
  padding?: string;
  borderRadius?: string; // e.g., "12px"
}

const SketchyPanel: React.FC<SketchyPanelProps> = ({
  children,
  className = "",
  bg = "white",
  stroke = "#000",
  padding = "1rem",
  borderRadius = "12px",
}) => {
  return (
    <div className={`relative ${className}`} style={{ padding }}>
      {/* SVG overlay for sketchy border */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ overflow: "visible" }}
      >
        {/* multiple slightly offset rectangles for sketchy look */}
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            x={2 + i}
            y={2 + i}
            width={`calc(100% - ${4 + i * 2}px)`}
            height={`calc(100% - ${4 + i * 2}px)`}
            rx={borderRadius}
            ry={borderRadius}
            fill={i === 0 ? bg : "none"}
            stroke={stroke}
            strokeWidth={i === 0 ? 2 : 1.5}
            strokeLinecap="round"
            strokeDasharray={i === 0 ? undefined : "4 2"}
            opacity={i === 0 ? 1 : 0.6 - i * 0.15}
          />
        ))}
      </svg>

      {/* Panel content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default SketchyPanel;
