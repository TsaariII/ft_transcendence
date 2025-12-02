import React, { useEffect, useState, useRef } from "react";
import TournamentHeader from "../components/tournament/TournamentHeader";
import TournamentBracket from "../components/tournament/TournamentBracket";
import TournamentSetup from "../components/tournament/TournamentSetup";
import GameSettings from "../components/game/GameSettings";
import { TBD_PLAYER } from "../../shared/constants";
import CenteredContainer from "../components/layout/CenteredContainer";
import SketchyButton from "../components/ui/SketchyButtons";
import DoodleButton from "../components/ui/DoodleButton";
import { ArcadeFrame } from "../components/layout/ArcadeFrame";
import type { TournamentState, Match } from "../types/tournament";
import Button from "../components/ui/Button";
import { API_PROTOCOL } from "../../shared/api-protocols";
import { useAuth } from "../context/AuthContext";
import { CreateTournamentPayload,
		CreateTournamentResponse,
		TournamentResetPayload,
		} from "../../shared/payloads";
import { useTranslation } from "../shared/Translation";
import tournamentPodium from "../assets/doodles/tournamentPodium.png"
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { FaCircle } from "react-icons/fa6";


const TournamentLobby: React.FC = () => {
	const { t, lang } = useTranslation();
	const { isLoggedIn, loading, refreshSession, tournament, setTournament } = useAuth();
	const [showSetup, setShowSetup] = useState(false);                               // Indicates whether we are in tournament setup mode (adding players etc.)
	const [player1Token, setPlayer1Token] = useState<string | null>(null);
	const [player2Token, setPlayer2Token] = useState<string | null>(null);
	const [activeGameId, setActiveGameId] = useState<string | null>(null);           // Game state: which match is currently active
	const [currentGame, setCurrentGame] = useState<Match | null>(null);
	const [gameStarted, setGameStarted] = useState(false);
	const [gameSettings, setGameSettings] = useState<{
		ballSpeed: number;
		paddleSize: number;
		paddleSpeed: number;
		maxScore: number;
	} | null>(null);
	const [showSettingsModal, setShowSettingsModal] = useState(false);  // controls whether game settings modal is shown
	const [gameResult, setGameResult] = useState<{
		gameId: string;
		winner: string;
		loser: string;
		score: [number, number];
	} | null>(null);

	const [showInGameHelp, setShowInGameHelp] = useState(false);

	//	Initialize useRef for the iframe
	const iframeRef = useRef<HTMLIFrameElement>(null);
	
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

	// Listens for messages from pong iframe 

	useEffect(() => {
		async function handleMessage(event: MessageEvent) {
			//if (event.origin !== "http://localhost:3000")
			//	return;
			if (event.data?.type === "GAME RESULT") {
				console.log("Received game result from iframe:", event.data.payload);
				const result = event.data.payload;
				
				setGameResult(result);
				handleMatchEnd();
				
				console.log("Calling refreshSession...");
				await refreshSession(); // capture updated state
				console.log(tournament);
			}
		}
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [refreshSession]);

	useEffect(() => {
		if (tournament) {
			console.log("Tournament updated:", tournament);
		}
	}, [tournament]);

  /*
   * Creates a new tournament
   *  Triggered when user clicks "Start a new tournament"
   * - Sends a request to backend
   * - Stores tournament state in React
   */

	const handleCreateTournament = async () => {
		const payload: CreateTournamentPayload = { max_players: 4 };
		console.log('Creating tournament...');
		try {
			const res = await fetch(API_PROTOCOL.CREATE_TOURNAMENT.path, {
				method: API_PROTOCOL.CREATE_TOURNAMENT.method,
				credentials: 'include',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
		});

		const data: CreateTournamentResponse = await res.json();
		console.log('📦 Create tournament response:', data);

		if (data.status === "OK") {
			console.log('Setting tournament:', data.tournament);
			setTournament(data.tournament);
			//await refreshSession();     // Refresh session to update tournament state
		} else {
			console.error("Error creating tournament:", data.error);
			alert(t("tournament.error.create"));
		}
		} catch (err) {
			console.error("Network error creating tournament:", err);
			alert(t("tournament.error.network"));
		}
	};

	const handleCancelTournament = async () => {
		if (!tournament)
			return;

		try {
			const test = tournament.tournament_id;
			const payload = { tournament_id: test };
			const url = API_PROTOCOL.CANCEL_TOURNAMENT.path.replace(':id', tournament.tournament_id);
			console.log("is their a tournamnet id", tournament.tournament_id);
			const res = await fetch(API_PROTOCOL.CANCEL_TOURNAMENT.path, {
				method: API_PROTOCOL.CANCEL_TOURNAMENT.method,
				credentials: "include",
				 headers: {
					'Content-Type': 'application/json'
  				},
				body: JSON.stringify(payload)
				
			});

			if (!res.ok) throw new Error("Failed to cancel tournament");

			setShowSettingsModal(false);
			setGameResult(null);
			handleMatchEnd();

			await refreshSession(); // Refresh session to update tournament status

		} catch (err) {
			console.error("Error cancelling tournament:", err);
		}
	};

   /* Starts a specific match from the tournament bracket
	- If game settings have not been set, shows settings modal */

	const handleStartTournamentGame = async (match: Match) => {
		if (!tournament || !tournament.bracket)
			return;

		// Find the round and index for this match
		const roundIndex = tournament.bracket.findIndex(r =>
			r.some(m => m.match_id === match.match_id)
		);
		if (roundIndex === -1) {
			console.error("Match not found in bracket", match);
			return;
		}
		const idx = tournament.bracket[roundIndex].findIndex(m => m.match_id === match.match_id);

		// Show settings modal if not set
		if (!gameSettings) {
			setCurrentGame(match);
			setShowSettingsModal(true);
			return;
		}

		await startTournamentGame(match);
	};

	/* Called when user confirms game settings
	  Starts the match with the selected settings */
	
	const handleSettingsConfirm = async (settings: typeof gameSettings) => {
		setGameSettings(settings);
		setShowSettingsModal(false);
	};

   /* Sends API request to start a tournament match
	  Updates player tokens and active match */

	const startTournamentGame = async (match: Match) => {
		if (!match || !gameSettings)
			return;
	
		const payload = { gameId: match.match_id, tournamentId: tournament?.tournament_id };
		try {
			const res = await fetch(API_PROTOCOL.START_GAME.path, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				credentials: "include",
			});

			const data = await res.json();
			if (!res.ok || !data.playerTokens) {
				console.error("Failed to start tournament game:", data.error || res.statusText);
				return;
			}
			//console.log("show me p1 id ", data.playerTokens.player1);
			//console.log("show me p2 id ", data.playerTokens.player2);

			setPlayer1Token(data.playerTokens.player1);
			setPlayer2Token(data.playerTokens.player2);
			setGameStarted(true);
			setCurrentGame(match);					// Sets active match to trigger iframe
			setActiveGameId(match.match_id);

		} catch (err) {
			console.error("Error starting tournament match:", err);
			alert(t("tournament.error.network"));
		}
	};

	// Ends a match - Simply clears the current game state and closes iframe
	
	const handleMatchEnd = () => {

		setCurrentGame(null);
		setActiveGameId(null);
		setPlayer1Token(null);
		setPlayer2Token(null);
		setGameStarted(false);
	};

	const closeTournament = async () => {
		if (!tournament)
			return;

		const payload: TournamentResetPayload = {tournamentID: tournament.tournament_id};
		
		try {
			const res = await fetch(API_PROTOCOL.CLOSE_TOURNAMENT.path, {
				method: API_PROTOCOL.TOURNAMENT_RESET.method,
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				console.error("Tournament reset failed:", res.status);
				return;
			}

			await refreshSession();
			
		} catch (err) {
			console.error("Error resetting tournament:", err);
			alert(t("tournament.error.network"));
		}
	};

	//  Handle AuthContext states first
	if (loading) {
		return (
		<div className="p-6 font-hand text-lg text-center text-gray-300">
			{t("tournament.loading")}
		</div>
		);
	}

	if (!isLoggedIn) {
		return (
		<div className="p-6 font-hand text-xl text-center text-gray-300">
			{t("tournament.loginRequired")}
		</div>
		);
	}
	const setupInProgress = tournament && (
		tournament.status === "waiting" || 
		(tournament.status === "ongoing" && (!tournament.bracket || tournament.bracket.length === 0)));

	const bracketVisible = tournament && 
		(tournament.status === "ongoing" || tournament.status === "finished") && 
		tournament.bracket && 
		tournament.bracket.length > 0;

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
		<ArcadeFrame title={t("tournament.title")}>
			<CenteredContainer>
				<div className="flex justify-center px-6 w-full">
					{!showSettingsModal && !currentGame && (
						<div className="w-full max-w-4xl flex justify-center">
							{/* Start New Tournament Button - Shown when no tournament exists */}
							{!tournament && (
								<div className="mt-28">
									<DoodleButton
										imageSrc={tournamentPodium}
										width="w-80"
										height="h-80"
										hoverText={t("tournament.startNew")}
										hoverTextSize="text-3xl"
										strokeColor="#61bfbf"
										strokeWidth={1.5}
										animationDuration={200}
										onClick={handleCreateTournament}
									/>
								</div>
							)}

							{/* Tournament Setup - Shown when tournament status is "waiting" */}
							{setupInProgress && (
								<div className="w-full max-w-4xl min-w-0">
									<TournamentSetup
										onCancel={handleCancelTournament}
										onTournamentStarted={() => {}} 
									/>
								</div>
							)}

							{/* Tournament Bracket - Shown when tournament status is "ongoing" */}
								{bracketVisible &&(
									<TournamentBracket
										onStartMatch={handleStartTournamentGame}
										onCancel={handleCancelTournament}
										onClose={closeTournament}
									/>
							)}
						</div>
					)}

					{/* Game settings */}
					{showSettingsModal && (
						<div className="w-full max-w-2xl p-8 text-white">
							<GameSettings
								onConfirm={handleSettingsConfirm}
								onBack={() => {
									setShowSettingsModal(false);
									setCurrentGame(null);
								}}
							/>
						</div>
					)}

					{/* Start Game button */}
					{currentGame && gameSettings && !gameStarted && (
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
									onClick={() => { setGameSettings(null);
										setCurrentGame(null);
									}}
									className="px-6 py-2 text-white text-sm w-32"
								>
									{t("game.action.back")}
								</SketchyButton>
								
								<SketchyButton
									variant="shadow"
									bg="#58d1b7d9"
									hoverBg="#1ea58893"
									borderColor="#177863ff"
									onClick={() => startTournamentGame(currentGame!)}
									className="px-6 py-2 text-white text-sm w-32"
								>
									{t("game.action.start")}
								</SketchyButton>
							</div>
						</div>
					)}

					{/* Pong Game Iframe*/}
					{currentGame && activeGameId && player1Token && gameSettings &&(
						<div className="relative w-full flex justify-center items-center mt-6">
							{/* The arcade window */}
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
									src={`https://localhost:4004/pong_game/index.html?gameId=${activeGameId}&player1Token=${player1Token}&player2Token=${player2Token}&gameSettings=${encodeURIComponent(JSON.stringify(gameSettings))}`}
									className="absolute inset-0 w-full h-full border-none rounded-[20px]"
									scrolling="no"
								/>
							</div>
						</div>
					)}
				</div>
			</CenteredContainer>
		</ArcadeFrame>
	);
};

export default TournamentLobby;
