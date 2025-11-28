import React from "react";

interface SketchyPanelProps {
  children?: React.ReactNode;
  className?: string;
  bg?: string;     // panel fill color
  stroke?: string; // border stroke color
}

const SketchyPanel: React.FC<SketchyPanelProps> = ({
  children,
  className = "",
  bg = "white",
  stroke = "white",
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* SVG Border & Sketchy Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Base Hand-drawn Border */}
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          rx="12"
          ry="18"
          fill={bg}
          stroke={stroke}
          strokeWidth="2.3"
          strokeLinecap="round"
        />

        {/* Slightly imperfect inner line */}
        <rect
          x="8"
          y="8"
          width="84"
          height="84"
          rx="10"
          ry="14"
          fill="none"
          stroke={stroke}
          strokeWidth="1.4"
          strokeDasharray="3 5 2 4"
          opacity="0.65"
        />

        {/* 3D sketch shadow */}
        <path
          d="M 5 30 L 5 85 Q 5 95 22 95 L 95 95"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>

      {/* Panel content */}
      <div className="relative z-10 p-4">
        {children}
      </div>
    </div>
  );
};

export default SketchyPanel;
