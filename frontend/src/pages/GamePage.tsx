// current game page implementation is harness-like
//1. Log in dev1
//2. Log in dev2
//3. Create game as dev1
//4. Join second player
//5. Start game
//6. Launch iframe with both tokens

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API_PROTOCOL } from "../../shared/api-protocols";
import ChooseGameMode from "../components/game/ChooseGameMode";
import GameSettings from "../components/game/GameSettings";
import CenteredContainer from "../components/layout/CenteredContainer";
import MiniLogin from "../components/game/MiniLogin";
import { useTranslation } from "../shared/Translation";
import { useApiFetch } from "../utils/apiFetch"
import { ArcadeFrame } from "../components/layout/ArcadeFrame";
import SketchyButton from "../components/ui/SketchyButtons";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { FaCircle } from "react-icons/fa6";

type GameMode = "guest" | "login" | "ai";
//	const { isLoggedIn, loading, refreshSession, tournament, setTournament } = useAuth();
const Game: React.FC = () => {
	const { t } = useTranslation();
	const { isLoggedIn, loading, refreshSession, tournament, setTournament } = useAuth();
	const [gameStarted, setGameStarted] = useState(false);
	const [player1Token, setPlayer1Token] = useState<string | null>(null);
	const [player2Token, setPlayer2Token] = useState<string | null>(null);
	const [gameId, setGameId] = useState<string | null>(null);
	//const [loading, setLoading] = useState(true);
	const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
	const [showMiniLogin, setShowMiniLogin] = useState(false);
	const [gameSettings, setGameSettings] = useState<{
		ballSpeed: number;
		paddleSize: number;
		paddleSpeed: number;
		maxScore: number;
	} | null>(null);

	// Use apiFetch hook
	const apiFetch = useApiFetch();

	const [showInGameHelp, setShowInGameHelp] = useState(false);

	//  Initialize useRef for the iframe
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const refocusIframe = () => {
		try { iframeRef.current?.contentWindow?.focus(); } catch {}
		iframeRef.current?.focus();
	};
	// Function to safely focus the iframe after it loads
	const handleIframeLoad = () => {
		if (iframeRef.current) {
			// Use a minimal delay (50ms) to ensure the browser finishes processing the 'load' event
			// before we call focus(). This is necessary for some browsers.
			const timer = setTimeout(() => {
				iframeRef.current?.focus();
			}, 50); 
			return () => clearTimeout(timer);
		}
	};

	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			//if (event.origin !== "http://localhost:3000") return;

			if (event.data?.type === "GAME RESULT") {
			console.log(t("game.status.receivedResult"), event.data.payload);
			handleGameEnd();
			}

		refreshSession();

		}
		window.addEventListener("message", handleMessage);
			return () => window.removeEventListener("message", handleMessage);
		}, []);

	const handleGameEnd = () => {
		console.log(t("game.status.ended"));
		setPlayer1Token(null);
		setPlayer2Token(null);
		setGameId(null);
		setGameSettings(null);
		setGameStarted(false);
		setSelectedMode(null);

	};

	// Flow depending on selected game mode

	const handleModeSelect = async (mode:GameMode) => {
		setSelectedMode(mode);

		try {
		// 1. Create game
			const data = await apiFetch(API_PROTOCOL.CREATE_GAME.path, {
				method: API_PROTOCOL.CREATE_GAME.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: "local",
					mode: "vs",
					settings: null,
				}),
			});
			const { gameId: newGameId } = data;
			setGameId(newGameId);

			// 2. Show minilogin only if login mode is selected
			if (mode === "login") {
				setShowMiniLogin(true);
				return; // pause here until MiniLogin completes
			}

			// 3. For guest/AI opponent, join game immediately
			if (mode === "guest" || mode === "ai") {
				await joinGuestOrAi(newGameId, mode);
				// Flow continues to GameSettings because showMiniLogin is false
			}
		} catch (e: any) {
			console.error(e);
			if (e.sessionExpired) return; // handled inside apiFetch (redirect)
			alert(t("error.game.create"));
			setSelectedMode(null);	
			setGameId(null);
		}
	};

	const joinGuestOrAi = async (gameId: string, mode: "guest" | "ai") => {
		try {
			const data = await apiFetch(API_PROTOCOL.JOIN_GAME.path, {
				method: API_PROTOCOL.JOIN_GAME.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					gameId,
					type: mode,
					mode: "local",
					player_count: 2,
				}),
			});

			console.log("Joined game successfully:", data);
			return data; // in case caller needs the response

		} catch (e: any) {
			console.error("Failed to join guest/AI opponent:", e);
			if (e.sessionExpired) return; // handled by apiFetch (redirect)
			throw new Error("Failed to join guest/AI opponent.");
		}
	};
			

	// Launch game 

	const handleStartGame = async (settings: typeof gameSettings) => {
		if (!gameId) return;

		try {
			const startData = await apiFetch(API_PROTOCOL.START_GAME.path, {
				method: API_PROTOCOL.START_GAME.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ gameId }),
			});

			setPlayer1Token(startData.playerTokens.player1);
			setPlayer2Token(startData.playerTokens.player2);
			setGameStarted(true);

		} catch (e: any) {
			console.error("Failed to start game:", e);
			if (e.sessionExpired) return; 
			alert(t("error.game.start"));
		}
	};

	let arcadeTitle = t("game.mode.title");

		if (selectedMode === "login" && showMiniLogin) {
			arcadeTitle = t("game.mode.loginSecond");
		} else if (selectedMode && !gameStarted && !showMiniLogin && !gameSettings) {
			arcadeTitle = t("game.settings.title");
		} else if (gameStarted && gameId) {
			arcadeTitle = "PONG";
		}

	if (loading) return <div>{t("game.checkingLogin")}</div>;
	if (!isLoggedIn) return <div>{t("game.loginRequired")}</div>;

	const Key = ({ children }: { children: React.ReactNode }) => (
	<span className="inline-flex items-center justify-center px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 
				rounded bg-gray-700 text-white font-mono text-[10px] sm:text-xs md:text-sm w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6">
		{children}
	</span>
);

	const ControlsBox = () => (
	<div className="text-[12px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-body text-center px-2 sm:px-4">
		<h3 className="font-semibold mb-1 sm:mb-2 md:mb-3 text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-3xl">{t("game.controls.title")}</h3>

		<div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 md:gap-4 lg:gap-8 xl:gap-10 mt-2 sm:mt-4 md:mt-6 lg:mt-8 xl:mt-10">
			{/* LEFT COLUMN */}
			<div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5 xl:space-y-6 mb-2 sm:mb-4">
				<h4 className="text-[#37a58d] font-semibold mb-1 sm:mb-3 md:mb-5 lg:mb-6 xl:mb-8 text-xs sm:text-base md:text-lg lg:text-xl">{t("game.controls.keys")}</h4>
				{/* Left Controls */}
				<div>
					<span className="font-medium">{t("game.controls.leftLabel")}</span>
					<div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 mt-1 sm:mt-2">
						<Key>W</Key> {t("game.controls.up")} <Key>S</Key> {t("game.controls.down")}
					</div>
				</div>
				{/* Right Controls */}
				<div>
					<span className="font-medium">{t("game.controls.rightLabel")}</span>
					<div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 mt-1 sm:mt-2">
						<FaArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 flex-shrink-0"/> {t("game.controls.up")}
						<FaArrowDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 flex-shrink-0" /> {t("game.controls.down")}
					</div>
				</div>
			</div>
			{/* RIGHT COLUMN */}
			<div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5 xl:space-y-6">
				<h4 className="text-[#37a58d] font-semibold mb-1 sm:mb-3 md:mb-5 lg:mb-6 xl:mb-8 text-xs sm:text-base md:text-lg lg:text-xl">{t("game.controls.powerup.title")}</h4>
				<div className="flex justify-center mb-1 sm:mb-2">
					<FaCircle className="text-purple-400 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
				</div>
				<li className="flex items-center justify-center">
					{t("game.controls.powerup.desc")}
				</li>
			</div>
		</div>
	</div>
);

	return (
		<ArcadeFrame title={arcadeTitle}>
			<CenteredContainer>
				{/* Mode selection */}
				{!selectedMode && (
					<div className="max-w-4xl mx-auto mt-12 gap-12 p-6">
						<ChooseGameMode
							onSelectMode={handleModeSelect}
						/>
					</div>
				)}
				{/* Mini login */}
				{selectedMode === "login" && showMiniLogin && gameId && (
					<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl">
						<MiniLogin
							gameId={gameId}
							onLoginSuccess={(token) => {
								setPlayer2Token(token);
								setShowMiniLogin(false);
							}}
							onCancel={() => {
								setShowMiniLogin(false);
								setGameId(null);
								setSelectedMode(null);
							}}
						/>
					</div>
				)}

				{/* Game settings modal */}
				{selectedMode && gameId && !showMiniLogin && !gameSettings && !gameStarted && (
					<div className="w-full max-w-2xl p-8 text-white">
						<GameSettings
							onConfirm={(settings) => setGameSettings(settings)}
							onBack={() => {
								setSelectedMode(null);
								setGameId(null);
								setPlayer2Token(null);
							}}
						/>
					</div>
				)}

				{/* Start Game button */}
				{selectedMode && gameId && gameSettings && !gameStarted && (
				<div className="w-full max-w-3xl p-8 text-white flex flex-col items-center space-y-12">
					<div className="p-4 text-center">
						<ControlsBox />
					</div>
					<div className="w-full flex flex-col sm:flex-row items-center justify-center gap-8">
						<SketchyButton
							variant="shadow"
							bg="#a48d988a"
							hoverBg="#a91a5f8a"
							borderColor="#a91a5f8a"
							onClick={() => { setGameSettings(null)}}
							className="px-6 py-2 text-white text-sm w-32"
							>
							{t("game.action.back")}
						</SketchyButton>
						<SketchyButton
							variant="shadow"
							bg="#58d1b7d9"
							hoverBg="#1ea58893"
							borderColor="#177863ff"
							onClick={() => handleStartGame(gameSettings)} // pass settings to startGame
							className="px-6 py-2 text-white text-sm w-32"
							>
							{t("game.action.start")}
						</SketchyButton>
					</div>
				</div>
				)}

				{/* Game iframe */}
				{gameStarted && player1Token && player2Token && gameId && (
				<div className="relative w-full flex justify-center items-center mt-6">

					{/* The decorative arcade “screen window” */}
					<div
						className="
							relative
							overflow-hidden
							rounded-[30px]
							bg-[#3b0d2a]
							shadow-[0_0_35px_rgba(0,0,0,0.6)]
							w-full
							max-w-[1280px]
							aspect-video
						"
						style={{
							width: "100%",
							height: "100%",
							maxWidth: "1280px",
							aspectRatio: "16 / 9",
							maxHeight: "100%",
						}}
					>

						{/* Help Overlay */}
						{showInGameHelp && (
							<div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-4 md:p-6">
								<div className="w-full max-w-xl bg-[#3b0d2a] rounded-xl p-3 sm:p-4 md:p-5 
											text-sm text-white shadow-xl">
									<ControlsBox />
									
									<div className="mt-2 sm:mt-3 md:mt-4 flex justify-center">
										<SketchyButton
											variant="shadow"
											bg="#58d1b7d9"
											hoverBg="#1ea58893"
											borderColor="#177863ff"
											onClick={() => {
												setShowInGameHelp(false);
												refocusIframe();
											}}
											className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 text-[10px] sm:text-xs md:text-sm 
													lg:text-base text-white"
										>
											{t("common.gotIt")}
										</SketchyButton>
									</div>
								</div>
							</div>
						)}

						{/* Help Button */}
						<button
							type="button"
							tabIndex={-1}
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => setShowInGameHelp(true)}
							className="absolute right-4 top-4 z-20 px-2.5 py-1.5 rounded-md
									border border-[#fffcc2] text-[#fffcc2] text-sm hover:bg-[#fffcc2] hover:text-black"
						>
							?
						</button>

						{/* The actual game iframe */}
						<iframe
							ref={iframeRef}
							onLoad={handleIframeLoad}
							src={`https://localhost:4004/pong_game/index.html?gameId=${gameId}&player1Token=${player1Token}&player2Token=${player2Token}&gameSettings=${encodeURIComponent(JSON.stringify(gameSettings))}`}
							className="absolute inset-0 w-full h-full border-none rounded-[20px]"
							scrolling="no"
						/>
					</div>
				</div>
				)}
			</CenteredContainer>
		</ArcadeFrame>
	);
};

export default Game;

