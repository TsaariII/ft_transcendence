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

if (loading) return <div>{t("game.checkingLogin")}</div>;
if (!isLoggedIn) return <div>{t("game.loginRequired")}</div>;

const Key = ({ children }: { children: React.ReactNode }) => (
	<kbd className="inline-block px-1.5 py-0.5 rounded border border-gray-600 bg-gray-900 font-mono text-xs">
		{children}
	</kbd>
);

const ControlsBox = () => (
	<div className="text-sm text-gray-200 text-center">
		<h3 className="font-semibold mb-2">{t("game.controls.title")}</h3>
		<ul className="space-y-1 list-none p-0">
			<li>
				<span className="font-medium">{t("game.controls.leftLabel")}</span>{" "}
				<Key>W</Key> ({t("game.controls.up")}) / <Key>S</Key> ({t("game.controls.down")})
			</li>
			<li>
				<span className="font-medium">{t("game.controls.rightLabel")}</span>{" "}
				<Key>⬆️</Key> ({t("game.controls.up")}) / <Key>⬇️</Key> ({t("game.controls.down")})
			</li>
			<li className="mt-2">
				<span className="font-medium">{t("game.controls.powerup.title")}</span>{" "}
				<Key>🟣</Key> {t("game.controls.powerup.desc")}
			</li>
		</ul>
	</div>
);

return (
	<ArcadeFrame>
	<CenteredContainer>
		{/* Mode selection */}
		{!selectedMode && (
		<div className="w-full max-w-lg sketch-border rounded-xl p-8 text-white shadow-2xl">
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
			<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl">
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
		<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl flex flex-col items-center space-y-4">
			<div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 text-center">
				<ControlsBox />
			</div>

			<div className="flex flex-col items-center space-y-3">
			<button
				onClick={() => handleStartGame(gameSettings)} // pass settings to startGame
				className="px-10 py-4 text-xl font-bold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
				>
				{t("game.action.start")}
			</button>
			<button
				onClick={() => { setGameSettings(null)}}
				className="px-6 py-2 text-sm font-medium text-gray-800 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors"
				>
				{t("game.action.back")}
			</button>
			</div>
		</div>
		)}
		{/* Game iframe */}
		{gameStarted && player1Token && player2Token && gameId && (
	<div
		className="
		relative
		bg-gray-900 p-4 rounded-xl shadow-2xl shadow-gray-700/80
		mx-auto flex justify-center items-center
		min-w-[900px] min-h-[600px]
		"
	>
		<button
			type="button"
			tabIndex={-1}
			onMouseDown={(e) => e.preventDefault()}
			onClick={() => setShowInGameHelp(true)}
			className="absolute right-3 top-3 z-20 px-2.5 py-1.5 rounded-md bg-gray-800/70 border border-gray-600 text-white text-sm hover:bg-gray-700"
			aria-label="Game help"
		>
			?
		</button>

		<div
		className="relative overflow-hidden"
		style={{
			width: "100%",
			maxWidth: "1280px",   // lock playable area max width
			aspectRatio: "16 / 9", // maintain aspect ratio
		}}
		>

		{showInGameHelp && (
			<div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center p-6">
				<div className="w-full max-w-md bg-gray-900/95 border border-gray-700 rounded-xl p-5 text-white shadow-xl">
					<ControlsBox />
					<div className="mt-4 flex justify-center">
						<button
							type="button"
							onClick={() => {
								setShowInGameHelp(false);
								refocusIframe();
							}}
								className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700"
							>
								{t("common.gotIt")}
						</button>
					</div>
				</div>
			</div>
		)}
		<iframe
			ref={iframeRef}
			// Attach the focus handler to the iframe's onLoad event
			onLoad={handleIframeLoad}
			src={`https://localhost:4004/pong_game/index.html?gameId=${gameId}&player1Token=${player1Token}&player2Token=${player2Token}&gameSettings=${encodeURIComponent(JSON.stringify(gameSettings))}`}
			// The iframe is absolutely positioned to fill the responsive container
			className="absolute inset-0 w-full h-full border-none rounded-lg"
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

