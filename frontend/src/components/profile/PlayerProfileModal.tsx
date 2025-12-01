import React, { useState, useEffect } from "react";
import defaultAvatar from "../../assets/avatars/default-avatar.png";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { OtherUserProfilePayload, OtherUserProfileResponse } from "../../../shared/payloads";
import { useTranslation } from "../../shared/Translation";

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
	<div
		className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
			onClick={onClose}
	>
		<div
			onClick={(e) => e.stopPropagation()}
			className="w-full max-w-3xl px-6"
		>
			<div className="relative mx-auto mb-4 p-6 border-4 border-[#FFFCC7] bg-[#D54751]"
          		style={{
            		borderRadius: '60px',
            		boxShadow: '4px 6px 0 rgba(89,50,43, 0.9)',
            		transform: 'rotate(-0.4deg)',
          		}}
			>

				{/* Close button */}
				<button
					onClick={onClose}
					className="float-right text-[#FFFCC7] hover:text-white text-xl"
				>
					✕
				</button>

				{/* Player Header */}
				<section className="flex flex-col items-center mb-8 mt-4">
					<div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap mb-4">
						{/* Rank */}
						<div className="flex-2 flex justify-start">
							<span className="inline-flex items-center gap-1 rounded-full border-2 border-[#59322B] bg-[#4DA394] px-3 py-1 text-sm font-body text-[#FFFCC7] shadow-[3px_4px_0_#59322B]">
								<span className="text-xs md:text-sm text-[#59322B] font-hand">
									{t("profile.rank")}
								</span>
								<span className="font-body text-[#FFFCC7]"> 
									{profile.rank}
								</span>
							</span>
						</div>

						{/* Avatar */}
		  				<div className="relative">
								<div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#59322B] border-4 border-[#FFFCC7] flex items-center justify-center shadow-[4px_6px_0_#59322B]">
									<img
										src={profile.avatarFile || defaultAvatar}
										alt={`${profile.username} avatar`}
										className="w-28 h-28 md:h-36 md:w-40 rounded-full object-cover border-2 border-[#59322B]"
										onError={(e) => ((e.currentTarget as HTMLImageElement).src = defaultAvatar )}
									/>
								</div>
						</div>
						
						{/* Score */}
						<div className="flex-1 flex justify-end">
							<span className="inline-flex items-center gap-1 rounded-full border-2 border-[#59322B] bg-[#4DA394] px-3 py-1 text-sm shadow-[3px_4px_0_#59322B]">
								<span className="text-xs md:text-sm text-[#59322B] font-hand">
									{t("profile.score")}
								</span>
								<span className="font-body text-[#FFFCC7]">
									{profile.score}
								</span>
							</span>
						</div>
					</div>

					{/* Username */}
					<h2 
						className="mt-2 font-cupcake text-[#FFFCC7] text-3xl md:text-4xl tracking-wider"
              				style={{ textShadow: `
                  				-3px 0 #000,
                  				3px 0 #000,
                  				0 3px #000,
                  				0 -3px #000,
                  				3px 3px #59322B,
                 				-3px -3px #59322B`
               				}}
						>
							{profile.username}
					</h2>
				</section>

				{/* Stats */}
				<section className="mt-4 w-full">
					<div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-1 place-items-center">
						<Stat label={`${t("profile.stats.victories")} `} value={profile.victories} />
						<Stat label={`${t("profile.stats.losses")} `} value={profile.losses} />
						<Stat label={`${t("profile.stats.matches")} `} value={profile.totalMatches} />
					</div>
				</section>

				{/* Match history */}
				<section className="mt-6 w-full">
					<div className="max-w-xl mx-auto">
						<h3
							className="mb-4 font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
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

					<div className="rounded-2xl border-2 border-[#59322B]  bg-[#4DA394] shadow-[3px_4px_0_#59322B] overflow-hidden">
						{!profile.matchHistory || profile.matchHistory.length === 0 ? (
							<div className="px-4 py-6 text-[#59322B] text-sm font-body">
								{t("profile.history.empty")}
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left border-collapse">
									<thead className="bg-[#59322B] text-[#FFFCC7]">
										<tr>
											<Th>{t("profile.history.opponent")}</Th>
											<Th>{t("profile.history.result")}</Th>
											<Th>{t("profile.history.score")}</Th>
											<Th>{t("profile.history.time")}</Th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#59322B]/60 bg-[#4DA394]">
										{matches.slice(0, 10).map((m: any, idx: number) => {
											const result = (m.result || "").toLowerCase();
											const resultClass =
												result === "win"
													? "text-emerald-400 font-hand"
													: result === "loss"
													? "text-rose-400 font-hand"
													: "text-gray-300 font-hand";
					
					
											const translatedResult =
												result === "win"
													? t("profile.result.win")
													: result === "loss"
													? t("profile.result.loss")
													: "-";
											return (
												<tr 
													key={`${m.opponent}-${m.timestamp}-${idx}`}
													className="border-t border-[#59322B]/40"
												>
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
						</div>
					</section>
				</div>
			</div>
		</div>
	);
};


/* Small stat card matching profile */
function Stat({ 
	label,
	value,
	className = "",

} : { 
	label: string;
	value: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`inline-flex flex-col items-center rounded-2xl border-2 border-[#59322B] bg-[#4DA394] px-4 py-2 md:px-5 md:py-2.5 min-w-[120px] md:min-w-[150px] shadow-[3px_4px_0_#59322B] ${className}`}>
			<div className="text-xs md:text-sm text-[#59322B] font-hand">{label}</div>
			<div className="text-2xl md:text-3xl font-body text-[#FFFCC7]">{value ?? 0}</div>
		</div>
	);
}

function Th({ children }: {children: React.ReactNode }) {
	return <th className="px-3 py-2 text-xs font-hand tracking-wide">{children}</th>;
}

function Td({
	children,
	className= "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <td className={`px-3 py-2 text-xs font-hand text-[#59322B] ${className}`}>{children}</td>;
}