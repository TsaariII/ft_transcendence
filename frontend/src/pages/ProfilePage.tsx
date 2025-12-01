import defaultAvatar from "../assets/avatars/default-avatar.png";
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../shared/Translation";
import PlayerProfileModal from "../components/profile/PlayerProfileModal";

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
    	  <div className="flex justify-center px-6 py-6">
  		  {/* Semi-transparent card for content */}
  		  <div className="w-full max-w-4xl bg-gray-900/90 rounded-lg p-6 text-white">
      		<h1 className="text-3xl font-bold mb-4">{t("profile.title")}</h1>

      		{/* Avatar + profile name */}
	  		<section className="relative mb-6 rounded-2xl border border-gray-700/60 bg-gradient-to-b from-gray-800/60 to-gray-900/60 p-5 shadow-xl">
				<div className="flex items-center gap-5 md:gap-6">
					{/* Avatar */}
					<div className="relative shrink-0">
						<div className="rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-emerald-500">
							<img
								src={user.avatarFile || defaultAvatar}
								alt={`${user.username} avatar`}
								className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover ring-2 ring-black/30"
								onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultAvatar; }}
							/>
						</div>
					</div>

					{/* Name */}
					<div className="min-w-0">
						<h2 className="text-2xl md:text-3xl font-bold tracking-tight break-words">
							{user.username}
						</h2>

						<div className="mt-3 flex flex-wrap items-center gap-2">
							<span className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800/70 px-3 py-1 text-sm text-gray-200">
								<span className="text-gray-400">{t("profile.rank")}</span>
								<span className="font-semibold">{user.rank}</span>
							</span>
							<span className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800/70 px-3 py-1 text-sm text-gray-200">
								<span className="text-gray-400">{t("profile.score")}</span>
								<span className="font-semibold">{user.score}</span>
							</span>
						</div>
					</div>
				</div>
			</section>

			{/* Stats */}
			<section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				<StatCard label={`${t("profile.stats.victories")} 🏅`} value={user.victories ?? 0} />
				<StatCard label={`${t("profile.stats.losses")} 💣`} value={user.losses ?? 0} />
				<StatCard label={`${t("profile.stats.matches")} 🏓`} value={(user.totalMatches ?? matches.length) ?? 0} />
				{/* <StatCard label={`${t("profile.stats.tournamentWins")} 🏆`} value={user.tournamentWins ?? user.tournament_wins ?? 0} /> */}
			</section>

			Match History
			<section className="mt-6">
				<h3 className="font-semibold mb-2">{t("profile.history.title")}</h3>
					<div className="rounded-lg border border-gray-700 bg-gray-800/40 overflow-hidden">
					{matches.length === 0 ? (
						<div className="px-4 py-6 text-gray-400">
							{t("profile.history.empty")}
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left border border-gray-700 rounded-lg">
								<thead className="bg-gray-800/50">
									<tr>
										<Th>{t("profile.history.opponent")}</Th>
										<Th>{t("profile.history.result")}</Th>
										<Th>{t("profile.history.score")}</Th>
										<Th>{t("profile.history.time")}</Th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-700">
									{matches.map((m: any, idx: number) => {
										const result = (m.result || "").toLowerCase();
										const resultClass =
											result === "win"
											? "text-emerald-400"
											: result === "loss"
											? "text-rose-400"
											: "text-gray-300";

										const opponentId = m.opid;

										const resultLabel =
											result === "win"
											? t("profile.result.win")
											: result === "loss"
											? t("profile.result.loss")
											: "-";
										return (
											<tr key={`${m.opponent}-${m.timestamp}-${idx}`} className="border-t border-gray-700">
												<Td>
													<button
														className="text-indigo-400 hover:text-indigo-300 underline"
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
		</div>
			{selectedPlayer && (
				<PlayerProfileModal
				userId={selectedPlayer}
				onClose={() => setSelectedPlayer(null)}
				/>
			)}
		</div>
	);
};

function StatCard({ 
	label,
	value,
	className = "",
}: {
	label: string;
	value: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`rounded-lg border border-gray-700 p-4 bg-gray-800/40 ${className}`}>
			<div className="text-sm text-gray-400">{label}</div>
			<div className="text-2xl font-semibold">{value ?? 0}</div>
		</div>
	);
}

function Th({ children }: {children: React.ReactNode }) {
	return <th className="px-3 py-2 text-sm font-semibold">{children}</th>;
}

function Td({
	children,
	className= "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <td className={`px-3 py-2 text-sm ${className}`}>{children}</td>;
}

export default Profile;
