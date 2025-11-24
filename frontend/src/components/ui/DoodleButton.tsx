import React from "react";

interface DoodleBoxProps {
  label?: string;
  icon?: React.ReactNode; // icon component or image
  imageSrc?: string; // optional imported image
  onClick?: () => void;
  width?: string; // tailwind width class e.g., "w-32"
  height?: string; // tailwind height class e.g., "h-32"
  rotate?: string; // tailwind rotate class e.g., "rotate-2"
  borderRadius?: string; // tailwind rounded class or custom e.g., "rounded-xl"
}

const DoodleBox: React.FC<DoodleBoxProps> = ({
  label,
  icon,
  imageSrc,
  onClick,
  width = "w-36",
  height = "h-36",
  rotate = "rotate-0",
  borderRadius = "rounded-xl",
}) => {
  return (
    <button
      onClick={onClick}
      className={`group ${width} ${height} p-4 text-white border-4 border-white ${borderRadius} ${rotate} 
        flex flex-col items-center justify-center gap-2 hover:bg-white hover:text-black transition-all duration-300`}
    >
      {icon && <div className="text-5xl">{icon}</div>}
      {imageSrc && (
        <img src={imageSrc} alt={label} className="w-3/4 h-3/4 object-contain" />
      )}
      {label && <span className="text-xl font-bold">{label}</span>}
    </button>
  );
};

export default DoodleBox;
