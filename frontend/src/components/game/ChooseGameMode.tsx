import React from "react";
import { useTranslation } from "../../shared/Translation";
import { useRandomBorderRadius } from "../../hooks/useRandomBorderRadius";

interface ChooseGameModeProps {
onSelectMode: (mode: "guest" | "login" | "ai") => void;
}

const ChooseGameMode: React.FC<ChooseGameModeProps> = ({ onSelectMode }) => {
	const { t } = useTranslation();

	const guestRef = useRandomBorderRadius<HTMLButtonElement>();
	const loginRef = useRandomBorderRadius<HTMLButtonElement>();
	const aiRef = useRandomBorderRadius<HTMLButtonElement>();

return (
	<div className="flex flex-col items-center space-y-4">
	<h2 className="font-hand text-4xl text-teal-700 dark:text-teal-300 mb-4">
		{t("game.mode.title")}
	</h2>
	<button
		ref={guestRef}
		className="sketch-border font-hand text-lg px-6 py-3 hover:bg-[#61bfbf] text-white font-semibold rounded-lg w-64"
		onClick={() => onSelectMode("guest")}
	>
		{t("game.mode.guest")}
	</button>
	<button
		ref={loginRef}
		className="sketch-border font-hand text-lg px-6 py-3 hover:bg-[#ffb7bb] text-white font-semibold rounded-lg w-64"
		onClick={() => onSelectMode("login")}
	>
		{t("game.mode.loginSecond")}
	</button>
	<button
		ref={aiRef}
		className="sketch-border font-hand text-lg px-6 py-3 hover:bg-[#bfbfe3] text-white font-semibold rounded-lg w-64"
		onClick={() => onSelectMode("ai")}
	>
		{t("game.mode.ai")}
	</button>
	</div>
);
};

export default ChooseGameMode;
