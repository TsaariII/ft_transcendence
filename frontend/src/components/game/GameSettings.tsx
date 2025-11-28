import React, { useState } from "react";
import { useTranslation } from "../../shared/Translation";

interface GameSettingsProps {
onConfirm: (settings: {
	ballSpeed: number;
	paddleSize: number;
	paddleSpeed: number;
	maxScore: number;
	powerUp: boolean;
}) => void;
onBack?: () => void; 
}

const GameSettings: React.FC<GameSettingsProps> = ({ onConfirm, onBack }) => {
const { t } = useTranslation();
const [ballSpeed, setBallSpeed] = useState(4);
const [paddleSize, setPaddleSize] = useState(150);
const [paddleSpeed, setPaddleSpeed] = useState(10);
const [maxScore, setMaxScore] = useState(5);
const [powerUp, setPowerUp] = useState(false);

return (
	<div className="max-w-xl mx-auto p-6 bg-gray-800 text-white rounded-lg shadow-lg flex flex-col space-y-4">
	<h2 className="font-hand text-4xl font-bold text-teal-400 text-center">{t("game.settings.title")}</h2>

	<div>
		<label>{t("game.settings.ballSpeed")}: {ballSpeed}</label>
		<input
		type="range"
		min="1"
		max="8"
		value={ballSpeed}
		onChange={(e) => setBallSpeed(Number(e.target.value))}
		className="w-full"
		/>
	</div>

	<div>
		<label>{t("game.settings.paddleSize")}: {paddleSize} {t("game.common.px")}</label>
		<input
		type="range"
		min="100"
		max="200"
		value={paddleSize}
		onChange={(e) => setPaddleSize(Number(e.target.value))}
		className="w-full"
		/>
	</div>

	<div>
		<label>{t("game.settings.paddleSpeed")}: {paddleSpeed}</label>
		<input
		type="range"
		min="1"
		max="20"
		value={paddleSpeed}
		onChange={(e) => setPaddleSpeed(Number(e.target.value))}
		className="w-full"
		/>
	</div>

	<div>
		<label>{t("game.settings.maxScore")}: {maxScore}</label>
		<input
		type="number"
		min="1"
		max="10"
		value={maxScore}
		onChange={(e) => {
			const value = Number(e.target.value);
			const clamped = Math.max(1, Math.min(10, value)); // enforce 1–10 range
			setMaxScore(clamped);
			}}
		className="w-full text-black p-1 rounded"
		/>
	</div>

	<div className="flex items-center justify-between mt-4">
	<span>{t("game.settings.powerUp")}</span>
	<button
		type="button"
		className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out
		${powerUp ? "bg-green-500" : "bg-gray-500"}`}
		onClick={() => setPowerUp(!powerUp)}
	>
		<div
		className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out
			${powerUp ? "translate-x-6" : "translate-x-0"}`}
		/>
	</button>
	</div>

	<div className="flex justify-between mt-4">
		{onBack && (
		<button
			className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
			onClick={onBack}
		>
			{t("game.action.back")}
		</button>
		)}
		<button
		className="px-4 py-2 bg-indigo-600 hover:bg-indigo-800 rounded"
		onClick={() =>
			onConfirm({ ballSpeed, paddleSize, paddleSpeed, maxScore, powerUp })
		}
		>
		{t("game.action.confirm")}
		</button>
	</div>
	</div>
);
};

export default GameSettings;
