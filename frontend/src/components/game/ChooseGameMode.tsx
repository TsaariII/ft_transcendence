import React from "react";
import { useTranslation } from "../../shared/Translation";
import SketchyPanel from "../layout/SketchyPanel";
import DoodleButton from "../ui/DoodleButton";
import robot from "../../assets/doodles/robot.png";
import suitcase from "../../assets/doodles/suitcase.png";
import lock from "../../assets/doodles/lock.png";

interface ChooseGameModeProps {
onSelectMode: (mode: "guest" | "login" | "ai") => void;
}

const ChooseGameMode: React.FC<ChooseGameModeProps> = ({ onSelectMode }) => {
	const { t } = useTranslation();

	return (
		<div className="w-full text-white items-center">
			{/* Heading text */}
			<h2 className="text-4xl font-hand mb-6 text-center">
				{t("game.mode.text")}
			</h2>
		<div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-12">
				<DoodleButton
					imageSrc={suitcase}
					width="w-56"
					height="h-56"
					scale="scale-150"
					hoverText={t("game.mode.guest")}
					strokeColor="#6ee7b7"
					strokeWidth={1.5}
					animationDuration={200}
					onClick={() => onSelectMode("guest")}
				>
				</DoodleButton>
				<DoodleButton
					imageSrc={lock}
					width="w-56"
					height="h-56"
					scale="scale-150"
					hoverText={t("game.mode.loginSecond")}
					strokeColor="#6ee7b7"
					strokeWidth={1.5}
					animationDuration={200}
					onClick={() => onSelectMode("login")}
				>
				</DoodleButton>
				<DoodleButton
					imageSrc={robot}
					width="w-56"
					height="h-56"
					scale="scale-125"
					hoverText={t("game.mode.ai")}
					strokeColor="#6ee7b7"
					strokeWidth={1.5}
					animationDuration={200}
					onClick={() => onSelectMode("ai")}
				>
				</DoodleButton>
			</div>
		</div>
	);
};

export default ChooseGameMode;
