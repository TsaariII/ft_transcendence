import React, { useState, useEffect } from "react";
import type { TournamentPlayer, TournamentState } from "../../types/tournament";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { VerifyPlayerPayload, VerifyPlayerResponse } from "../../../shared/payloads";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import { useApiFetch } from "../../utils/apiFetch";
import { useTranslation } from "../../shared/Translation";
import { useRandomBorderRadius } from "../../hooks/useRandomBorderRadius";
import SketchyButton from "../../components/ui/SketchyButtons";

// Username: must start with letter, 6-12 chars, letters, numbers, underscore allowed
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{5,11}$/;

// Password: 8-16 chars, letters, numbers and allowed special chars
const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_\-+=.]{8,16}$/;

// Alias: 5–10 chars, letters/numbers/_
const ALIAS_REGEX = /^[a-zA-Z0-9_]{5,10}$/;

interface PlayerListProps {
	tournament: TournamentState;
	onRemovePlayer: (role: string) => void;                // remove a player from the list
	onAliasChanged?: (val: boolean) => void;
}

type PlayerFormData = {
	username: string;
	password: string;
	alias: string;
};

type FormErrors = Record<string, {
	username?:string;
	password?:string;
	alias?: string;
}>;

type FormData = Record<string, PlayerFormData>;

const emptyPlayerForm = (): PlayerFormData => ({ username: "", password: "", alias: "" });

const PlayerList: React.FC<PlayerListProps> = ({
	tournament, onRemovePlayer, onAliasChanged
	}) => {
	const { t } = useTranslation();
	const { setTournament, refreshSession } = useAuth();
	const [formData, setFormData] = useState<FormData>({});
	const [errors, setErrors] = useState<FormErrors>({});
	const [loading, setLoading] = useState<string | null>(null);
	const [isEditingAlias, setIsEditingAlias] = useState<boolean>(false);
	const [tempAlias, setTempAlias] = useState('');
	const apiFetch = useApiFetch();


	const self = tournament.players.find(p => p.isSelf);
	const backendAlias = self?.alias ?? "";

	const aliasChanged =
		isEditingAlias ||
		tempAlias !== backendAlias ||
		!ALIAS_REGEX.test(tempAlias);


	useEffect(() => {
		setFormData(prev => {
		const next: FormData = { ...prev };

		tournament.players.forEach(p => {
			if (!next[p.role]) {
				if (p.isSelf) {
					next[p.role] = {
						username: p.username || "",
						password: "",
						alias: p.alias || "",
					};
				} else {
					next[p.role] = {
						username: "",
						password: "",
						alias: "",
					};
				}
			}
		});

		return next;
		});

		// Initialize tempAlias only when not editing and when it hasn't been set yet
		const self = tournament.players.find(p => p.isSelf);
		if (!isEditingAlias && tempAlias === "" && self?.alias) {
			setTempAlias(self.alias);
		}

		// note: tempAlias is not reset when player list changes
		// so user edits are preserved until they explicitly save

	}, [tournament.players, isEditingAlias]);

	const updateField = (role: string, field: keyof PlayerFormData, value: string) => {
		const player = tournament.players.find((p) => p.role === role)!;

		if (player.isSelf && field === 'alias') {
			setTempAlias(value);
		} else {
			setFormData((prev) => ({
				...prev,
				[role]: {
				...(prev[role] || emptyPlayerForm()),
				[field]: value,
				},
			}));
		}
	};

	const isFormComplete = (role: string, player: any): boolean => {
		const data = formData[role];

		if (player.isSelf) {
			return ALIAS_REGEX.test(tempAlias);
	
		}
		return (
		USERNAME_REGEX.test(data?.username ?? "") &&
		PASSWORD_REGEX.test(data?.password ?? "") &&
		ALIAS_REGEX.test(data?.alias ?? "")
		);
	};

	// Handles adding and verifying a tournament player

	const handleAddPlayer = async (role: string, player: TournamentPlayer) => {
		const data = formData[role];  // takes existing form data for the role
		
		// Determines the alias to be used:
		// -if the player is the logged-in user (isSelf), uses the temp alias from state
		// -otherwise, uses the alias entered in the form or falls back to empty string
		let aliasToUse = player.isSelf ? tempAlias : data?.alias || '';

		// Frontend validation
		
		const localErrors: Record<string, string | undefined> = {};

		
		// Validate alias
		if (!ALIAS_REGEX.test(aliasToUse)) {
			localErrors.alias = t("error.alias.format");
		}

		// Validate username + password for non-self players
		if (!player.isSelf) {
			if (!USERNAME_REGEX.test(data?.username ?? "")) {
				localErrors.username = t("auth.error.invalidCredentials");
			}

			if (!PASSWORD_REGEX.test(data?.password ?? "")) {
				localErrors.password = t("auth.error.invalidCredentials");
			}
		}

		// Check alias uniqueness among verified players
		const duplicate = tournament.players.some(
			p =>
				p.role !== role &&
				p.isVerified &&
				p.alias?.toLowerCase() === aliasToUse.toLowerCase()
		);

		if (duplicate) {
			localErrors.alias = t("error.alias.unique");
		}

		// If any frontend error exists -> stops
		if (Object.keys(localErrors).length > 0) {
			setErrors(prev => ({
				...prev,
				[role]: localErrors
			}));
			return;
		}

		// Clears previous errors
		setErrors(prev => {
			const newErr = { ...prev };
			delete newErr[role];
			return newErr;
		});

		// Backend communication
		try {
			setLoading(role);

			const payload: VerifyPlayerPayload = {
				role,
				username: player.isSelf ? player.username : data.username,	// use username entered in the form or logged-in player's username
				password: player.isSelf ? "" : data.password,	// only sends password if player is not self
				alias: aliasToUse,
			};

			// API call to backend to verify entered player
				const response: VerifyPlayerResponse = await apiFetch(API_PROTOCOL.VERIFY_PLAYER.path, {
				method: API_PROTOCOL.VERIFY_PLAYER.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (response.status === "OK" && response.tournament) {
				setTournament(response.tournament);
				await refreshSession();
			}

			if (response.status === "OK" && response.tournament) {
			// Update the tournament in context
				setTournament(response.tournament);
				await refreshSession();
		}

			// Clear errors for the role on success
			setErrors((prev) => {
				const next = { ...prev };
				delete next[role];
				return next;
			});

			if (player.isSelf) {
				// Exit editing mode for the logged in player on success
				setIsEditingAlias(false);
				// ensures tempAlias matches saved backend alias
				// but let's set it proactively if response contains the tournament player alias:
				const updatedSelf = response?.tournament?.players?.find((p: TournamentPlayer) => p.isSelf);
				if (updatedSelf?.alias) {
					setTempAlias(updatedSelf.alias);
				}
			}
			
			} catch (err: any) {
				if (err.sessionExpired) return;

				let message = t("error.network"); // default fallback
				
				try {
					const parsed = JSON.parse(err.message);
					if (parsed.error === "Verification failed?") {
						 message = t("auth.error.invalidCredentials");
					} else if (parsed.error) {
						message = parsed.error; // use backend error otherwise
					}
				} catch (_) {
					// keep fallback
				}

				setErrors(prev => ({
					...prev,
					[role]: { alias: message }
			}));

		} finally {
			setLoading(null);
		}
	};
	
	const handleRemovePlayer = async (role: string) => {
		setFormData((prev) => ({ ...prev, [role]: emptyPlayerForm() }));
		setErrors((prev) => {
		const next = { ...prev };
		delete next[role];
		return next;
		});

	onRemovePlayer(role);
	await refreshSession();
	};

	useEffect(() => {
		if (onAliasChanged) onAliasChanged(aliasChanged);
	}, [aliasChanged, onAliasChanged]);
	
	// Helper to determine if a player's fields are locked in the UI
	// Uses backend status === "ready" as the indicator that the backend considers the player ready
	const renderPlayers = tournament.players.map((player) => {
		const role = player.role;
		const isCurrentlyLoading = loading === role;

		// Use backend status === "ready" as the single source of truth for "ready"
		const verifiedPlayer = tournament.players.find(p => p.role === role);
		const isPlayerReady = verifiedPlayer?.status === "ready";

		const isSelfReadyButLocked =
		player.isSelf && isPlayerReady && !isEditingAlias && !!player.alias;

		const isOtherPlayerLocked =
		!player.isSelf && isPlayerReady;

		const isAliasLocked = isOtherPlayerLocked || isSelfReadyButLocked;

		const data = formData[role] || { username: "", password: "", alias: "" };
		const fieldErrs = errors[role] || {};

		//const userRef = useRandomBorderRadius<HTMLButtonElement>();
		//const passRef = useRandomBorderRadius<HTMLButtonElement>();
		//const aliasRef = useRandomBorderRadius<HTMLButtonElement>();
	
	return (
		<div
			key={role}
			className="flex flex-col gap-1">
			< div className="mt-2 flex items-start gap-2">
			 {/* ✔ icon */}
				<span className="w-5 h-5 flex-shrink-0 flex items-center justify-center mt-3">
					{isPlayerReady && (
						<span className="w-4 h-4 rounded-full bg-cyan-400 text-white text-[0.4rem] font-bold flex items-center justify-center">
							✔
						</span>
					)}
				</span>
			
				<div className="flex flex-col sm:flex-row flex-wrap w-full gap-2 items-stretch sm:items-center font-body text-lg">
					{/* Username */}
					<input
						type="text"
						placeholder={t("auth.username")}
						disabled={player.isSelf || isPlayerReady}
						value={player.isSelf || isPlayerReady ? player.username : data.username}
						onChange={(e) => updateField(role, "username", e.target.value)}
						className={`w-full h-[3.5rem] sketch-border px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#3F839C]
							p-2 flex-1 min-w-0 w-full sm:w-auto
							${fieldErrs.username ? "border-red-500" : "border-gray-300"}
							${player.isSelf || isPlayerReady
							? `${isPlayerReady ? "text-indigo-400" : "text-gray-400"} bg-[#300D42] cursor-not-allowed`
							: "bg-[#300D42] text-white"
						}`}
					/>

					{/* Password */}
					<input
						type="password"
						placeholder={t("auth.password")}
						disabled={player.isSelf || isPlayerReady}
						value={player.isSelf || isPlayerReady ? "********" : data.password}
						onChange={(e) => updateField(role, "password", e.target.value)}
						className={`w-full h-[3.5rem] sketch-border border-[#FFFCC7] bg-gray-800/60 px-3 py-2
							placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#3F839C]
							p-2 flex-1 min-w-0 w-full sm:w-auto
							${fieldErrs.password ? "border-red-500" : "border-gray-300"}
							${player.isSelf || isPlayerReady
							? `${isPlayerReady ? "text-indigo-400" : "text-gray-400"} bg-[#300D42] cursor-not-allowed`
							: "bg-[#300D42] text-white"
						}`}
					/>

					{/* Alias */}
					<input
						type="text"
						placeholder={t("common.alias")}
						disabled={isAliasLocked}
						value={
						player.isSelf
							? tempAlias
							: data.alias || player.alias || ""
						}
						onChange={(e) => updateField(role, "alias", e.target.value)}
						className={`w-full h-[3.5rem] sketch-border border-[#FFFCC7] px-3 py-2
							placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#3F839C]
							p-2 flex-1 min-w-0 w-full sm:w-auto
							${fieldErrs.alias ? "border-red-500" : "border-gray-300"}
							${isAliasLocked
							? "bg-[#300D42] cursor-not-allowed"
							: "bg-[#300D42]"
							}
							${isPlayerReady ? "text-indigo-400" : "text-white"}
						`}
						/>

					{/* Action Buttons (Other players) */}
					{!player.isSelf && !isPlayerReady && (
						<SketchyButton
							variant="shadow"
							bg="#D9897A"
							hoverBg="#C8553E"
							onClick={() => handleAddPlayer(role, player)}
							disabled={isCurrentlyLoading}
						
							>
								{isCurrentlyLoading ? t("tournament.adding") : t("tournament.addPlayer")}
						</SketchyButton>
					)}

					{!player.isSelf && isPlayerReady && (
						<Button
							onClick={() => handleRemovePlayer(role)}
							disabled={isCurrentlyLoading}
							className="sketch-border p-2 border border-gray-700 rounded flex-1 min-w-0 w-full sm:w-auto min-w-[6.3rem]"
							>
								{t("common.remove")}
						</Button>
					)}

					{/* Action Buttons (Player1) */}
					{player.isSelf && (
						<div className="flex items-center gap-2">
							{/* Set/Edit Alias button */}
							<SketchyButton
								variant="shadow"
								bg="#D9897A"
								hoverBg="#C8553E"
								onClick={() => {
									if (isPlayerReady && !isEditingAlias) {
										setIsEditingAlias(true);
										setTempAlias(player.alias || "");
									} else {
										// Save Alias
										handleAddPlayer(role, player);
									}
								}}
								// Check completion against the dedicated logic now
								disabled={isCurrentlyLoading}
								>
								{isCurrentlyLoading
								? t("common.saving")
								: !isPlayerReady
									? t("tournament.setAlias")
									: (isEditingAlias  || aliasChanged)
										? t("tournament.saveAlias")
										: t("tournament.editAlias")}
							</SketchyButton>
						</div>
					)}
					</div>
				</div>
				
				{/* Inline field errors (shown only after clicking button) */}
					<div className="text-red-500 text-sm mt-1 ml-[1.8rem] flex flex-col gap-0.5">
						{fieldErrs.username && (
							<div className="text-red-500 text-sm">{fieldErrs.username}</div>
						)}
						{fieldErrs.password && (
							<div className="text-red-500 text-sm">{fieldErrs.password}</div>
						)}
						{fieldErrs.alias && (
							<div className="text-red-500 text-sm">{fieldErrs.alias}</div>
						)}
					</div>
			</div>
		);
	});

	return (
		<div className="space-y-2">
			{renderPlayers}
		</div>
	);
};

export default PlayerList;
