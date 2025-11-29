import React, { useEffect, useState } from "react";
import PlayerList from "./PlayerList";
import type { TournamentState, Match } from "../../types/tournament";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { TBD_PLAYER } from "../../../shared/constants";
import { useAuth } from "../../context/AuthContext";
import { StartTournamentPayload, StartTournamentResponse, RemovePlayerPayload, RemovePlayerResponse } from '../../../shared/payloads';
import Button from "../ui/Button";
import { useApiFetch } from "../../utils/apiFetch";
import { useTranslation } from "../../shared/Translation";
import SketchyButton from "../../components/ui/SketchyButtons";


interface TournamentSetupProps {
	onCancel: () => void;
	onTournamentStarted?: () => void; 
}

const TournamentSetup: React.FC<TournamentSetupProps> = ({ onCancel, onTournamentStarted }) => {
	const { t } = useTranslation();
	const { tournament, setTournament, refreshSession } = useAuth();
	const apiFetch = useApiFetch();
	const [loading, setLoading] = useState(false);
	const [loadingSession, setLoadingSession] = useState(true);
	const [aliasChanged, setAliasChanged] = useState(false);

	useEffect(() => {
		const loadSession = async () => {
			setLoadingSession(true);
			await refreshSession();
			setLoadingSession(false);
		};
		loadSession();
	}, [refreshSession]);

	if (loadingSession) {
		return <div className="text-gray-300 mt-8">{t("tournament.loading")}</div>;
	}

	if (!tournament) {
		return (
			<div className="text-gray-300 mt-8">
				{t("tournament.noTournament")}
			</div>
		);
	}

	const handleRemovePlayer = async (role: string) => {
		const payload: RemovePlayerPayload = {
			tournament_id: tournament.tournament_id,
			role,
		};
		try {
		setLoading(true);
		const data: RemovePlayerResponse = await apiFetch(
		API_PROTOCOL.REMOVE_PLAYER_FROM_TOURNAMENT.path,
		{
			method: API_PROTOCOL.REMOVE_PLAYER_FROM_TOURNAMENT.method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}
		);

		console.log("lets see return after remove player", data);
		 if (data.status === "OK" && data.tournament) {
			setTournament(data.tournament);
			} else {
			console.error("Error removing player:", data.error);
			}
		} catch (err: any) {
			if (err.sessionExpired) return; // apiFetch handled redirect
			console.error("Network error when removing player:", err);
		} finally {
			setLoading(false);
		}
};
	/* Starts the tournament:
		- Sends tournament_id to backend
	*/

	const handleStartTournament = async () => {
		const payload: StartTournamentPayload = {
			tournament_id: tournament.tournament_id,
		};

		try {
			setLoading(true);
			const data: StartTournamentResponse = await apiFetch(
			API_PROTOCOL.START_TOURNAMENT.path,
			{
				method: API_PROTOCOL.START_TOURNAMENT.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			}
			);

			console.log("lets looky at the data sent ", data);
			if (data.status === "OK" && data.tournament) {
				setTournament(data.tournament);
				await refreshSession(); 
				if (onTournamentStarted)
					onTournamentStarted();
			} else {
					console.error("Tournament start error:", data.error);
			}

		console.log("Tournament object from backend:", tournament);
		} catch (err: any) {
			if (err.sessionExpired) return;
			console.error(err)
		} finally {
			setLoading(false);
		}
	};

	/* Setup (player list) is in progress when tournament status is
		'waiting' - all players haven't been added yet or
		'ongoing' - all players have been added but bracket has not been built yet
	For some reason backend sends status as status: status: "waiting" */

	const setupInProgress = tournament && (
		tournament.status?.status === "waiting" || 
		(tournament.status?.status === "ongoing" && 
			(!tournament.bracket || tournament.bracket.length === 0)));
	
		const allPlayersReady =
			tournament?.players?.every((player) => player.status === "ready") ?? false;

	const tournamentCanStart =
		tournament &&
			tournament.status?.status === "ongoing" &&
			allPlayersReady;

	return (
			<div className="mt-3 space-y-24">
				{setupInProgress && (
				<div>
					<p className="font-hand text-4xl text-[#FFFCC7] mb-16 ml-8">{t("tournament.players")}</p>

					<PlayerList
						tournament={tournament}
						onRemovePlayer={handleRemovePlayer}
						onAliasChanged={setAliasChanged}
					/>
				</div>
				)}

				<div className="flex gap-24 mt-6 ml-7">
					<SketchyButton
						variant="shadow"
						bg="#7C5483"
						hoverBg="#3A1C4B"
						className="text-xl px-6 py-3 rounded-lg w-64" 
						onClick={onCancel} disabled={loading}>
						{t("tournament.cancel")}
					</SketchyButton>

					<SketchyButton
						variant="shadow"
						bg="#3F839f"
						hoverBg="#125a74"
						className="text-xl px-6 py-3 rounded-lg w-64" 
						onClick={handleStartTournament}
						disabled={!tournamentCanStart || loading || aliasChanged}
					>
						{loading
							? t("common.processing")
							: tournament.can_start
							? t("tournament.start")
							: t("tournament.start")}
					</SketchyButton>
				</div>
			</div>
	);
};

export default TournamentSetup;
