import React, { useState } from "react";
import { useTranslation } from "../../shared/Translation";
import SketchyButton from "../ui/SketchyButtons";

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
		<div className="max-w-xl mx-auto p-4 font-body text-lg text-white flex flex-col space-y-4">
			<div>
				<label>{t("game.settings.ballSpeed")}: {ballSpeed}</label>
					<input
						type="range"
						min="1"
						max="8"
						value={ballSpeed}
						onChange={(e) => setBallSpeed(Number(e.target.value))}
						className="doodle-slider"
						style={{
							"--percent": `${((ballSpeed - 1) / (8 - 1)) * 100}%`
						} as React.CSSProperties}
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
						className="doodle-slider"
						style={{
							"--percent": `${((paddleSize - 100) / (200- 100)) * 100}%`
						} as React.CSSProperties}
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
						className="doodle-slider"
						style={{
							"--percent": `${((paddleSpeed - 1) / (20 - 1)) * 100}%`
						} as React.CSSProperties}
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
						className="w-full text-black p-1 rounded-[11px_6px_12px_9px] border-2 border-[#FFFCC7] shadow-md outline-none hover:shadow-lg focus:shadow-lg transition-all"
						style={{
							background: "#FFFCC7",
							borderStyle: "solid",
							borderColor: "black",
							boxShadow: "2px 2px 0 #59322B, inset 0 0 2px #fff"
						}}
					/>
			</div>

			<div className="flex items-center justify-between mt-4">
				<span>{t("game.settings.powerUp")}</span>
				<button
					type="button"
					onClick={() => setPowerUp(!powerUp)}
					className={`w-14 h-7 flex items-center p-1 rounded-[12px_8px_11px_9px] border-2 border-black duration-300 ease-in-out
						${powerUp ? "bg-[#0B9FBD] shadow-[2px_2px_0_#59322B]" : "bg-[#FFFCC7] shadow-[2px_2px_0_#59322B]"}
					`}
				>
					<div
						className={`bg-[#0B9FBD] w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out
							${powerUp ? "translate-x-7" : "translate-x-0"} 
							`}
						style={{ boxShadow: "2px 2px 0 #59322B, inset 0 0 2px #fff" }}
					/>
				</button>
			</div>

			<div className="flex justify-between mt-4">
				{onBack && (
				<SketchyButton
					variant="shadow"
					bg="#7C5483"
					hoverBg="#3A1C4B"
					className="text-xl w-32"
					onClick={onBack}
				>
					{t("game.action.back")}
				</SketchyButton>
				)}
				<SketchyButton
					variant="shadow"
					bg="#3F839C"
					hoverBg="#125a74"
					className="text-xl w-32" 
					onClick={() =>
						onConfirm({ ballSpeed, paddleSize, paddleSpeed, maxScore, powerUp })
					}
				>
				{t("game.action.confirm")}
				</SketchyButton>
			</div>
		</div>
	);
};

export default GameSettings;
