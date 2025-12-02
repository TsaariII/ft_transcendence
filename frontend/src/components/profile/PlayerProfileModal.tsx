import React, { useState, useEffect } from "react";
import defaultAvatar from "../../assets/avatars/default-avatar.png";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { OtherUserProfilePayload, OtherUserProfileResponse } from "../../../shared/payloads";
import { useTranslation } from "../../shared/Translation";
import CenteredContainer from "..//layout/CenteredContainer";
import { PiRanking } from "react-icons/pi";
import { MdOutlineSportsScore } from "react-icons/md"

type PlayerProfileModalProps = {
	userId: string;
	onClose: () => void;
};

const handleFetchOtherUser = async (userId: string) => {
	try {
		const url = new URL(API_PROTOCOL.GET_OTHER_PLAYER_PROFILE.path, window.location.origin);
		url.searchParams.append("user_id", userId);
		console.log("Other user iD:", userId);

		const res = await fetch(url.toString(), {
		method: API_PROTOCOL.GET_OTHER_PLAYER_PROFILE.method,
		credentials: 'include',
		});

		if (!res.ok) {
			throw new Error(`HTTP error ${res.status}`);
		}

		const data: OtherUserProfileResponse = await res.json();
		console.log("📦 Other player profile response:", data);
		return data;
	} catch (err) {
		console.error("Error fetching other player profile:", err);
		return null;
	}
};

const fmt = (ts: string) => {
		if (!ts) return "-";
		const dateUtc = new Date(ts.replace(" ", "T") + "Z");

		if (isNaN(dateUtc.getTime())) return ts;

		// Convert to Helsinki time
		const helsinki = new Date(
			dateUtc.toLocaleString("en-US", { timeZone: "Europe/Helsinki" })
		);

		// Format manually as D-M-YYYY HH:MM:SS
		const day = helsinki.getDate();
		const month = helsinki.getMonth() + 1;
		const year = helsinki.getFullYear();
		const hours = helsinki.getHours().toString().padStart(2, "0");
		const minutes = helsinki.getMinutes().toString().padStart(2, "0");
		const seconds = helsinki.getSeconds().toString().padStart(2, "0");

		return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export default function PlayerProfileModal({ userId, onClose }: PlayerProfileModalProps) {
	const { t } = useTranslation();
	const [profile, setProfile] = useState<OtherUserProfileResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	
	useEffect(() => {
		let active = true;

		handleFetchOtherUser(userId).then((data) => {
			if (!active)
				return;

			if (!data) {
				setError("Failed to load profile");
				setLoading(false);
				return;
			}

			setProfile(data);
			setLoading(false);
		});
		return () => { 
			active = false;
		};
	}, [userId]);


	if (loading)
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm text-white text-lg">
				{t("profile.loading")}
			</div>
		);

	if (error || !profile)
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm text-white text-lg">
				{error || t("profile.error.loading")}
			</div>
		);

	const matches = Array.isArray(profile.matchHistory) ? [...profile.matchHistory] : [];
	
	matches.sort((a: any, b: any) => {
	const ta = new Date(a.timestamp.replace(" ", "T") + "Z").getTime();
	const tb = new Date(b.timestamp.replace(" ", "T") + "Z").getTime();
	return tb - ta;
});

return (
	<CenteredContainer>
		<div
		className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="w-full max-w-3xl px-6"
			>
				<div
					className="relative p-8 border-8 border-[#FFFCC7] bg-[#6C0E42]"
						style={{
							borderRadius: '45px 50px 48px 52px',
							boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 8px 10px 0 rgba(89,50,43,0.9)',
						}}
				>
						{/* Screen inner */}
						<div
							className="relative border-6 border-[#333] bg-[#] p-4 sm:p-6 md:p-8 overflow-hidden"
								style={{
									borderRadius: '35px 40px 38px 42px',
									boxShadow: 'inset 0 0 50px rgba(255,252,199,0.8)',
									minHeight: 'clamp(400px, 60vh, 600px)',
								}}
							>
							{/* CRT scanlines effect */}
							<div
								className="absolute inset-0 pointer-events-none z-10"
									style={{
									background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
								}}
							/>
							{/* Screen glow */}
							<div
								className="absolute inset-0 pointer-events-none z-0"
									style={{
										background: 'radial-gradient(ellipse at center, rgba(85,255,170,0.05) 0%, transparent 70%)',
									}}
								/>

								{/* Close button */}
								<button
									onClick={onClose}
									className="float-right text-[#FFFCC7] hover:text-white text-xl"
								>
									✕
								</button>

								{/* Avatar + rank + score + username */}
								<section className="flex flex-col items-center">
									{/* Avatar */}
									<div className="relative flex justify-center">
										<div className="p-[3px] rounded-full shadow-[0_0_25px_rgba(228,83,188,0.65)]"
											style={{
												backgroundImage:
													"linear-gradient(135deg, #280523 0%, #AA007A 50%, #E453BC 100%)",
											}}
										>
											<div className="w-40 h-40 md:w-44 md:h-44 rounded-full flex items-center justify-center">
												<img
													src={profile.avatarFile || defaultAvatar}
													alt={`${profile.username} avatar`}
													className="w-40 h-40 w-40 md:h-40 md:w-40 rounded-full object-cover border-2 border-black/40"
													onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultAvatar; }}
												/>
											</div>
										</div>
									</div>
								</section>
				
								{/* Username */}
								<h2 className="mt-4 py-5 text-4xl sm:text-4xl md:text-5xl font-body text-center bg-gradient-to-r from-[#FFFCC7] via-[#110637] to-[#FFFCC7] bg-clip-text text-transparent leading-tight">
									{profile.username}
								</h2>

							{/* Stats */}
							<div className="flex justify-center w-full mt-8">
								<div className="w-full max-w-md bg-[#0b0214]/25 border border-[#FFFCC7]/40 rounded-lg p-2">
									{/* Top row: Rank + Score */}
									<div className="flex justify-around items-center mb-4 pb-2 border-b border-[#FFFCC7]/20">
									<div className="flex items-center gap-2">
										<p className="text-xs uppercase tracking-wide">{t("profile.rank")}:</p>
										<PiRanking className="text-2xl text-[#FFFCC7]" />
										<p className="text-2xl font-bold text-[#FFFCC7]">{profile.rank}</p>
									</div>

									<div className="flex items-center gap-2">
										<p className="text-xs uppercase tracking-wide">{t("profile.score")}:</p>
										<MdOutlineSportsScore className="text-2xl text-[#FFFCC7]" />
										<p className="text-2xl font-bold text-[#FFFCC7]">{profile.score ?? 0}</p>
									</div>
									</div>

									{/* Bottom row: Victories, Losses, Matches */}
									<div className="flex justify-around items-center">
									<div className="flex items-center gap-2">
										<p className="text-xs uppercase tracking-wide">{t("profile.stats.victories")}:</p>
										<span className="text-xl font-bold text-[#FFFCC7]">{profile.victories ?? 0}</span>
									</div>

									<div className="flex items-center gap-2">
										<p className="text-xs uppercase tracking-wide">{t("profile.stats.losses")}:</p>
										<span className="text-xl font-bold text-[#FFFCC7]">{profile.losses ?? 0}</span>
									</div>

									<div className="flex items-center gap-2">
										<p className="text-xs uppercase tracking-wide">{t("profile.stats.matches")}:</p>
										<span className="text-xl font-bold text-[#FFFCC7]">{(profile.totalMatches ?? matches.length) ?? 0}</span>
									</div>
									</div>
								</div>
							</div>

							{/* Match History */}
							<section className="mt-10 mb-10 w-full">
								<div className="max-w-xl mx-auto">
									<h3 className="mb-4 font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              							style={{ textShadow: `
                  							-3px 0 #000,
                  							3px 0 #000,
                  							0 3px #000,
                  							0 -3px #000,
                  							3px 3px #59322B,
                 							-3px -3px #59322B`
               							}}
									>
										{t("profile.history.title")}
									</h3>
						
									{!profile.matchHistory || profile.matchHistory.length === 0 ? (
										<div className="px-0 py-2 text-lg font-body text-gray-200">
												{t("profile.history.empty")}
										</div>
									) : (
										<div className="overflow-x-auto">
											<table className="w-full text-left border-collapse text-lg sm:text-lg font-body">
												<thead className="border-b border-gray-700 text-gray-200">
													<tr>
														<Th>{t("profile.history.opponent")}</Th>
														<Th>{t("profile.history.result")}</Th>
														<Th>{t("profile.history.score")}</Th>
														<Th>{t("profile.history.time")}</Th>
													</tr>
												</thead>
													<tbody>
													{matches.slice(0, 10).map((m: any, idx: number) => {
														const result = (m.result || "").toLowerCase();
														const resultClass =
															result === "win"
																? "text-emerald-400 font-body"
																: result === "loss"
																? "text-rose-400 font-body"
																: "text-gray-300 font-body";


														const translatedResult =
															result === "win"
																? t("profile.result.win")
																: result === "loss"
																? t("profile.result.loss")
																: "-";
														return (
															<tr key={`${m.opponent}-${m.timestamp}-${idx}`} className="border-t border-gray-800/80">
																<Td>{m.opponent}</Td>
																<Td className={resultClass}>{translatedResult}</Td>
																<Td>{m.score}</Td>
																<Td>{fmt(m.timestamp)}</Td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>
									)}
								</div>
							</section>
						</div>
					</div>
				</div>
			</div>
		</CenteredContainer>
	);
};

function Th({ children }: {children: React.ReactNode }) {
	return <th className="px-3 py-2 text-lg font-body tracking-wide text-[#FFFCC7]">{children}</th>;
}

function Td({
	children,
	className= "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <td className={`px-3 py-2 text-lg font-body text-[#FFFCC7] ${className}`}>{children}</td>;
}