import React from "react";

interface DoodleBoxProps {
  icon?: React.ReactNode; // icon component or image
  imageSrc?: string; // optional imported image
  onClick?: () => void;
  width?: string; // tailwind width class e.g., "w-32"
  height?: string; // tailwind height class e.g., "h-32"
  rotate?: string; // tailwind rotate class e.g., "rotate-2"
  borderRadius?: string; // tailwind rounded class or custom e.g., "rounded-xl"
  hoverStrokeColor?: string;
}

const DoodleBox: React.FC<DoodleBoxProps> = ({
  icon,
  imageSrc,
  onClick,
  width = "w-36",
  height = "h-36",
  rotate = "rotate-0",
  borderRadius = "rounded-xl",
  hoverStrokeColor = "stroke-blue-500",

}) => {
  return (
    <button
      onClick={onClick}
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
      {icon && (
        <div className={`transition-all group-hover:${hoverStrokeColor}`}>
          {icon}
        </div>
      )}
    </button>
  );
};

export default DoodleBox;
