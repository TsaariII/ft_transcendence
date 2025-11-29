import React, { useEffect, useState, useRef } from "react";
import TournamentHeader from "../components/tournament/TournamentHeader";
import TournamentBracket from "../components/tournament/TournamentBracket";
import TournamentSetup from "../components/tournament/TournamentSetup";
import GameSettings from "../components/game/GameSettings";
import { TBD_PLAYER } from "../../shared/constants";
import CenteredContainer from "../components/layout/CenteredContainer";
import SketchyButton from "../components/ui/SketchyButtons";
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
			const res = await fetch(API_PROTOCOL.TOURNAMENT_RESET.path, {
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
		tournament.status?.status === "waiting" || 
		(tournament.status?.status === "ongoing" && (!tournament.bracket || tournament.bracket.length === 0)));

	const bracketVisible = tournament && 
		tournament.status?.status == "ongoing" && 
		tournament.bracket && 
		tournament.bracket.length > 0;

	return (
		<ArcadeFrame title={t("tournament.title")}>
			<CenteredContainer>
				<div className="flex justify-center px-6">
					{!showSettingsModal && !currentGame && (
					<div className="w-full max-w-4xl">
						{/* Start New Tournament Button - Shown when no tournament exists */}
						{!tournament && (
							<>
							<img
								src={tournamentPodium}
								className="mx-auto w-80 mb-6 mt-8"
							/>
							<div className="pb-6 font-cupcake sm:text-xl md:text-3xl text-[#FFFCC7]">
								<button
									className="hover:text-[#3F839C]"
									style={{ textShadow: `
										-3px 0 #000,
										3px 0 #000,
										0 3px #000,
										0 -3px #000`}}
									onClick={handleCreateTournament}
								>
									{t("tournament.startNew")}
								</button>
							</div>
							</>
						)}

						{/* Tournament Setup - Shown when tournament status is "waiting" */}
						{setupInProgress && (
							<TournamentSetup
								onCancel={handleCancelTournament}
								onTournamentStarted={() => {}} 
							/>
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
							<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl">
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
							<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl flex flex-col items-center space-y-4">
								<button
									onClick={() => startTournamentGame(currentGame!)}
									className="px-10 py-4 text-xl font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
								>
									{t("game.action.start")}
								</button>
								<button
									onClick={() => { setGameSettings(null);
										setCurrentGame(null);
									}}
										className="px-6 py-2 text-sm font-medium text-gray-800 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors"
								>
									{t("game.action.back")}
								</button>
							</div>
						)}

						
					{/* Pong Game Iframe*/}
					{currentGame && activeGameId && player1Token && gameSettings &&(
					<div
						className="
							relative
							bg-gray-900 p-4 rounded-xl shadow-2xl shadow-gray-700/80
							mx-auto flex justify-center items-center
							min-w-[900px] min-h-[600px]
						"
						>
						<div
							className="relative overflow-hidden"
							style={{
							width: "100%",
							maxWidth: "1280px",
							aspectRatio: "16 / 9",
							}}
						>
							<iframe

								ref={iframeRef}
								// Attach the focus handler to the iframe's onLoad event
								onLoad={handleIframeLoad} 
								src={`https://localhost:4004/pong_game/index.html?gameId=${activeGameId}&player1Token=${player1Token}&player2Token=${player2Token}&gameSettings=${encodeURIComponent(JSON.stringify(gameSettings))}&lang=${encodeURIComponent(lang)}`}
								// The iframe is absolutely positioned to fill the responsive container
								className="absolute inset-0 w-full h-full border-none rounded-lg"
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
