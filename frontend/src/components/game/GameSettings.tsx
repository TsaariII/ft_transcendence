import React, { useState } from "react";
import { useTranslation } from "../../shared/Translation";
import SketchyButton from "../ui/SketchyButtons";
import { PiPingPongFill } from "react-icons/pi";
import { FaGauge } from "react-icons/fa6";
import { FaArrowsAltV, FaRunning, FaStar } from "react-icons/fa";
import { MdOutlineSportsScore } from "react-icons/md";

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
		<div className="mx-auto p-6 font-body text-lg text-white">
			{/* 2 COLUMN GRID */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-20 mt-14">
				{/* LEFT COLUMN */}
				<div className="space-y-4">

					{/* Ball Speed */}
					<div>
						<label className="flex items-center gap-4 pb-2">
							<FaGauge/>
							{t("game.settings.ballSpeed")}: {ballSpeed}
						</label>
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

					{/* Paddle Size */}
					<div>
						<label className="flex items-center gap-4 pb-2">
							<PiPingPongFill/>
							{t("game.settings.paddleSize")}: {paddleSize}px
						</label>
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

					{/* Paddle Speed */}
					<div>
						<label className="flex items-center gap-4 pb-2">
							<FaRunning/>
							{t("game.settings.paddleSpeed")}: {paddleSpeed}
						</label>
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
				</div>

				{/* RIGHT COLUMN */}
				<div className="space-y-4">

					{/* Max Score */}
					<div>
						<label className="flex items-center gap-4 pb-2">
							<MdOutlineSportsScore/>
							{t("game.settings.maxScore")}: {maxScore}
						</label>
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
							className="w-[10rem] text-black p-1 rounded-[11px_6px_12px_9px] border-2 border-[#FFFCC7] shadow-md outline-none hover:shadow-lg focus:shadow-lg transition-all"
							style={{
								background: "#FFFCC7",
								borderStyle: "solid",
								borderColor: "black",
								boxShadow: "2px 2px 0 #59322B, inset 0 0 2px #fff"
							}}
						/>
					</div>

					{/* Power Up */}
					<div>
						<label className="flex items-center gap-4 pb-2">
							<FaStar/>
							{t("game.settings.powerUp")}
						</label>

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
				</div>
			</div>
			<div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-16">
					{/* Back button */}
					{onBack && (
						<SketchyButton
							variant="shadow"
							bg="#a48d988a"
							hoverBg="#a91a5f8a"
							borderColor="#a91a5f8a"
							className="text-lg text-white w-32"
							onClick={onBack}
						>
							{t("game.action.back")}
						</SketchyButton>
					)}

					{/* Confirm button */}
					<SketchyButton
						variant="shadow"
						bg="#58d1b7d9"
						hoverBg="#1ea58893"
						borderColor="#177863ff"
						className="text-lg text-white w-32" 
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
