import defaultAvatar from "../assets/avatars/default-avatar.png";
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../shared/Translation";
import PlayerProfileModal from "../components/profile/PlayerProfileModal";
import { ArcadeFrame } from "../components/layout/ArcadeFrame";
import CenteredContainer from "../components/layout/CenteredContainer";

const Profile: React.FC = () => {
	const { t } = useTranslation();
	const { user, isLoggedIn, refreshSession } = useAuth();
	const [selectedPlayer, setSelectedPlayer] = React.useState(null);

	if (!isLoggedIn) return <div>{t("profile.loginRequired")}</div>;
	if (!user) return <div>{t("profile.loading")}</div>;

	const avatarSrc = user.avatarFile || defaultAvatar;

	const matches = Array.isArray(user.matchHistory) ? [...user.matchHistory] : [];
	matches.sort((a: any, b: any) => {
		const ta = new Date(a.timestamp).getTime();
		const tb = new Date(b.timestamp).getTime();
		return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
	});

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

	return (
		<ArcadeFrame title={t("profile.title")}>
			<CenteredContainer>
				{/* Main card */}
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
							<div className="w-40 h-40 md:w-44 md:h-44 rounded-full bg-[#0b0214] flex items-center justify-center">
								<img
									src={user.avatarFile || defaultAvatar}
									alt={`${user.username} avatar`}
									className="w-36 h-40 w-40 md:h-40 md:w-40 rounded-full object-cover border-2 border-black/40"
									onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultAvatar; }}
								/>
							</div>
						</div>
					</div>
				</section>
				
						{/* Username */}
							<h2 className="mt-4 py-5 text-4xl sm:text-4xl md:text-5xl font-body text-center bg-gradient-to-r from-[#FFFCC7] via-[#110637] to-[#FFFCC7] bg-clip-text text-transparent leading-tight">
								{user.username}
							</h2>

						{/* Stats */}
						<div className="mt-10 flex flex-wrap justify-center gap-y-2 gap-x-12 text-base sm:text-lg font-body">
							<div className="space-y-6">
								<p className="flex items-center gap-2">
									<span className="opacity-100">{t("profile.rank")}:</span>
								<span className="font-body">{user.rank}</span>
								</p>
								<p className="flex items-center gap-2">
									<span className="opacity-100">{t("profile.score")}:</span>
									<span className="font-body">{user.score ?? 0}</span>
								</p>
							</div>
							<div className="space-y-6">
								<p className="flex items-center gap-2">
									<span className="opacity-100">{t("profile.stats.victories")}:</span>
									<span className="font-body">{user.victories ?? 0}</span>
								</p>
								<p className="flex items-center gap-2">
									<span className="opacity-100">{t("profile.stats.losses")}:</span>
									<span className="font-body">{user.losses ?? 0}</span>
								</p>
								<p className="flex items-center gap-2">
									<span className="opacity-100">{t("profile.stats.matches")}:</span>
									<span className="font-body">{(user.totalMatches ?? matches.length) ?? 0}</span>
								</p>
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
						
						{matches.length === 0 ? (
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
										{matches.map((m: any, idx: number) => {
											const result = (m.result || "").toLowerCase();
											const resultClass =
												result === "win"
												? "text-emerald-400 font-hand"
												: result === "loss"
												? "text-rose-400 font-hand"
												: "text-gray-300 font-hand";

											const opponentId = m.user_id

											const resultLabel =
												result === "win"
													? t("profile.result.win")
													: result === "loss"
													? t("profile.result.loss")
													: "-";
												return (
													<tr key={`${m.opponent}-${m.timestamp}-${idx}`} className="border-t border-gray-800/80">
														<Td>
															<button
																className="text-[#FFFCC7] underline hover:no-underline"
																onClick={() => setSelectedPlayer(opponentId)}
															>
																{m.opponent}
															</button>
														</Td>
														<Td className={resultClass}>{resultLabel}</Td>
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
		{selectedPlayer && (
			<PlayerProfileModal
				userId={selectedPlayer}
				onClose={() => setSelectedPlayer(null)}
			/>
		)}
	</CenteredContainer>
	</ArcadeFrame>
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

export default Profile;
