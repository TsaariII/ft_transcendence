import React from "react";
import { useTranslation } from "../../shared/Translation";

interface ChooseGameModeProps {
onSelectMode: (mode: "guest" | "login" | "ai") => void;
}

const ChooseGameMode: React.FC<ChooseGameModeProps> = ({ onSelectMode }) => {
	const { t } = useTranslation();
return (
	<div className="flex flex-col items-center space-y-4">
	<h2 className="font-hand text-4xl text-teal-700 dark:text-teal-300 mb-4">
		{t("game.mode.title")}
	</h2>
	<button
		className="btn-handdrawn font-hand text-lg px-6 py-3 bg-black hover:bg-[#61bfbf] text-white font-semibold rounded-lg w-64"
		onClick={() => onSelectMode("guest")}
	>
		{t("game.mode.guest")}
	</button>
	<button
		className="btn-handdrawn font-hand text-lg px-6 py-3 bg-black hover:bg-[#ffb7bb] text-white font-semibold rounded-lg w-64"
		onClick={() => onSelectMode("login")}
	>
		{t("game.mode.loginSecond")}
	</button>
	<button
		className="btn-handdrawn font-hand text-lg px-6 py-3 bg-black hover:bg-[#bfbfe3] text-white font-semibold rounded-lg w-64"
		onClick={() => onSelectMode("ai")}
	>
		{t("game.mode.ai")}
	</button>
	</div>
);
};

export default ChooseGameMode;
