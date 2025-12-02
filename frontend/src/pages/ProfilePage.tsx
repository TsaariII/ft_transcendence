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
    	<div className="flex flex-col items-center px-6 py-6">
  		  <div className="w-full max-w-5xl relative mx-auto mb-4 p-6 border-4 border-[#FFFCC7] bg-[#D54751]"
          style={{
            width: '85%',
            borderRadius: '60px',
            boxShadow: '4px 6px 0 rgba(89,50,43, 0.9)',
            transform: 'rotate(-0.4deg)',
          }}>
			<div className="text-center">
			<h1 className="font-cupcake text-[#FFFCC7] text-5xl tracking-wider"
              style={{ textShadow: `
                  -3px 0 #000,
                  3px 0 #000,
                  0 3px #000,
                  0 -3px #000,
                  3px 3px #59322B,
                 -3px -3px #59322B`
               }}
			>
				{t("profile.title")}
			</h1>
		</div>
		</div>

  		  <div className="w-full flex flex-col relative z-0 mx-auto mb-4 px-1 p-6 border-4 border-[#FFFCC7] bg-[#D54751]"
          style={{
            width: '85%',
            borderRadius: '60px',
            boxShadow: '4px 6px 0 rgba(89,50,43, 0.9)',
            transform: 'rotate(-0.4deg)',
          }}>

      		{/* Avatar + profile name */}
			<section className="flex flex-col items-center mb-8">
				<div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap mb-4">
					<div className="flex-2 flex justify-start">
					<span className="inline-flex items-center gap-1 rounded-full border-2 border-[#59322B] bg-[#4DA394] px-3 py-1 text-sm font-body text-[#FFFCC7] shadow-[3px_4px_0_#59322B]">
						<span className="text-xs md:text-sm text-[#59322B] font-hand">{t("profile.rank")}</span>
						<span className="font-body text-[#FFFCC7]"> {user.rank}</span>
					</span>
					</div>

				<div className="relative">
						<div className="w-40 h-40 md:w-44 md:h-44 rounded-full bg-[#59322B] border-4 border-[#FFFCC7] flex items-center justify-center shadow-[4px_6px_0_#59322B]">
							<img
								src={user.avatarFile || defaultAvatar}
								alt={`${user.username} avatar`}
								className="w-36 h-40 w-40 md:h-40 md:w-40 rounded-full object-cover border-2 border-[#59322B]"
								onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultAvatar; }}
							/>
						</div>
				</div>
				
				<div className="flex-1 flex justify-end">
				<span className="inline-flex items-center gap-1 rounded-full border-2 border-[#59322B] bg-[#4DA394] px-3 py-1 text-sm shadow-[3px_4px_0_#59322B]">
					<span className="text-xs md:text-sm text-[#59322B] font-hand">{t("profile.score")}</span>
					<span className="font-body text-[#FFFCC7]">{user.score}</span>
				</span>
				</div>
				</div>
				
				<h2 className="mt-2 font-cupcake text-[#FFFCC7] text-3xl md:text-4xl tracking-wider"
              		style={{ textShadow: `
                  		-3px 0 #000,
                  		3px 0 #000,
                  		0 3px #000,
                  		0 -3px #000,
                  		3px 3px #59322B,
                 		-3px -3px #59322B`
               }}
			>
				{user.username}
			</h2>

			</section>

			{/* Stats */}
			<section className="mt-6 w-full">
				<div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-1 place-items-center">
				<StatCard label={`${t("profile.stats.victories")} `} value={user.victories ?? 0} />
				<StatCard label={`${t("profile.stats.losses")} `} value={user.losses ?? 0} />
				<StatCard label={`${t("profile.stats.matches")} `} value={(user.totalMatches ?? matches.length) ?? 0} />
				{/* <StatCard label={`${t("profile.stats.tournamentWins")} `} value={user.tournamentWins ?? user.tournament_wins ?? 0} /> */}
			   </div>
			</section>

			{/* Match History */}
			<section className="mt-6 w-full">
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
					<div className="rounded-2xl border-2 border-[#59322B]  bg-[#4DA394] shadow-[3px_4px_0_#59322B] overflow-hidden">
					{matches.length === 0 ? (
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
									{matches.map((m: any, idx: number) => {
										const result = (m.result || "").toLowerCase();
										const resultClass =
											result === "win"
											? "text-emerald-400 font-hand"
											: result === "loss"
											? "text-rose-400 font-hand"
											: "text-gray-300 font-hand";

										const opponentId = m.opid;

										const resultLabel =
											result === "win"
											? t("profile.result.win")
											: result === "loss"
											? t("profile.result.loss")
											: "-";
										return (
											<tr key={`${m.opponent}-${m.timestamp}-${idx}`} className="border-t border-[#59322B]/40">
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
		<div className={`inline-flex flex-col items-center rounded-2xl border-2 border-[#59322B] bg-[#4DA394] px-4 py-2 md:px-5 md:py.2.5 min-w-[120px] md:min-w-[150px] shadow-[3px_4px_0_#59322B] ${className}`}>
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

export default Profile;
