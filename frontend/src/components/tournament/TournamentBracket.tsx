import React from "react";
import type { TournamentState, TournamentPlayer, Match } from "../../types/tournament";
import { TBD_PLAYER } from "../../../shared/constants";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { useAuth } from "../../context/AuthContext";
import SketchyButton from "../../components/ui/SketchyButtons";
import { BsTrophy } from "react-icons/bs";
import { useTranslation } from "../../shared/Translation";


interface TournamentBracketProps {
	onStartMatch?: (match: Match) => void;    // callback when a match start is requested
	onCancel?: () => void                    // callback to cancel tournament
	onClose?: () => void                     // callback to close tournament
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
	onStartMatch,
	onCancel,
	onClose
}) => {
	const { t } = useTranslation();
	const { tournament } = useAuth(); // Always get the up-to-date tournament state

	if (!tournament || !tournament.bracket || tournament.bracket.length < 2) {
		return null;
	}

	if (!tournament.bracket[0] || !tournament.bracket[1] || !tournament.bracket[1][0]) {
		return null;
	}

	const firstRound = tournament.bracket[0];
	const finalMatch = tournament.bracket[1][0];

	const allMatchesFinished = firstRound.every(m => m.status === "finished") && finalMatch.status === "finished";

	/* Determines if a match can be started:
		- Round 1, Match 1: can be played if status is "pending"
		- Round 1, Match 2: can be played if Match 1 is "finished" and this match is "pending"
		- Final: both Round 1 matches must be "finished" and status must be "pending or ongoing???"
	*/
	const isMatchPlayable = (match: Match, round: number, idx: number): boolean => {
		if (match.status === "finished") {
			return false;
		}
		if (!tournament?.bracket)
			return false;

		if (round === 1)
		{
			if (idx === 0)
				return match.status === "pending";
			if (idx === 1) {
				const match1 = firstRound[0];
				return match1.status === "finished" && match.status === "pending";
			}
		}

		if (round === 2) {
				const allPrevFinished = firstRound.every(m => m.status === "finished");
				return allPrevFinished && (match.status === "pending" || match.status === "ongoing");
		}
		return false;
	};

	return (
	<div className="font-body flex flex-col items-center mt-8 mt:mt-10 gap-4 md:gap-8 relative px-4">
		{/* Winner */}
		<div className="flex flex-col items-center">
			<h3 className="font-body text-base md:text-lg mb-2">{t("tournament.winner")}</h3>
			<div className="sketch-border bg-[#4a0a2e] p-2 md:p-3 text-[#fffcc7] font-semibold w-32 md:w-40 text-center text-sm md:text-base">
				<BsTrophy className="inline-block mr-4 mb-1" />
				{(finalMatch?.winner ?? t("tournament.tbd"))}
			</div>
		</div>

		{/* Line from Winner to Final */}
		<div className="hidden md:block relative">
			<svg width="2" height="88" className="absolute -top-8 left-1/2">
				<line x1="1" y1="0" x2="1" y2="90" stroke="#6ee7b7" strokeWidth="2" />
			</svg>
		</div>

		{/* Final */}
		<div className="flex flex-col items-center gap-5 relative">
			<div className="relative flex justify-center gap-2 sm:gap-8 md:gap-48 lg:gap-72 items-center">
				<div className="flex flex-col items-center gap-2 relative">
					<div className="sketch-border bg-[#4a0a2e] p-2 md:p-3 text-[#fffcc7] w-32 md:w-40 text-center text-sm md:text-base">
						{firstRound[0].winner ?? t("tournament.tbd")}
					</div>
				</div>
				<div className="flex flex-col items-center gap-2 relative">
					<div className="sketch-border bg-[#4a0a2e] p-2 md:p-3 text-[#fffcc7] w-32 md:w-40 text-center text-sm md:text-base">
						{firstRound[1].winner ?? t("tournament.tbd")}
					</div>
				</div>
			
				{/* Horizontal line connecting players - Medium */}
				<svg width="204" height="2" className="hidden md:block lg:hidden absolute left-1/2 transform -translate-x-1/2">
					<line x1="0" y1="1" x2="204" y2="1" stroke="#6ee7b7" strokeWidth="2" />
				</svg>
				{/* Horizontal line connecting players - Large */}
				<svg width="300" height="2" className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
					<line x1="0" y1="1" x2="300" y2="1" stroke="#6ee7b7" strokeWidth="2" />
				</svg>
			
				{/* Vertical line down from final player1 center */}
				<svg width="2" height="54" className=" hidden md:block absolute top-12 left-20">
					<line x1="1" y1="2" x2="1" y2="54" stroke="#6ee7b7" strokeWidth="2" />
				</svg>
				{/* Vertical line down from final player2 center */}
				<svg width="2" height="54" className="hidden md:block absolute top-12 right-20">
					<line x1="1" y1="2" x2="1" y2="54" stroke="#6ee7b7" strokeWidth="2" />
				</svg>
		</div>

			<SketchyButton
				variant="shadow"
				bg="#58d1b7d9"
				hoverBg="#1ea58893"
				borderColor="#177863ff"
				onClick={() => onStartMatch?.(finalMatch)}
				disabled={!isMatchPlayable(finalMatch, 2, 0)}
				className={`
					-mt-4
					${finalMatch.status === "finished"
						? "text-gray-400 cursor-not-allowed"
						: !isMatchPlayable(finalMatch, 2, 0)
							? "text-gray-400 cursor-not-allowed"
							: "text-white hover:bg-indigo-700"
					}
				`}
			>
				{t("tournament.playFinal")}
			</SketchyButton>
		</div>

		{/* Round 1 Matches */}
		<div className="flex flex-col sm:flex-row justify-center gap-6 lg:gap-28 mt-8 w-full max-w-6xl">
			{firstRound.map((match, idx) => (
				<div key={match.match_id} className="flex flex-col items-center gap-4 md:gap-6 relative">
					<div className="flex gap-2 md:gap-3">
						<div className="sketch-border bg-[#4a0a2e] p-2 md:p-3 text-[#fffcc7] w-32 md:w-40 text-center text-sm md:text-base">
							{match.player1.alias}
						</div>
						<div className="sketch-border bg-[#4a0a2e] p-2 md:p-3 text-[#fffcc7] w-32 md:w-40 text-center text-sm md:text-base">
							{match.player2.alias}
						</div>
					</div>
					
					{/* Horizontal line connecting players */}
					<svg width="194" height="2" className="hidden md:block absolute -top-14 left-20">
						<line x1="8" y1="1" x2="194" y2="1" stroke="#6ee7b7" strokeWidth="2" />
					</svg>

					{/* Vertical line up from first players */}
					<svg width="2" height="56" className=" hidden md:block absolute -top-14 left-[5.5rem]">
						<line x1="1" y1="0" x2="1" y2="56" stroke="#6ee7b7" strokeWidth="2" />
					</svg>
					{/* Vertical line up from second players */}
					<svg width="2" height="56" className="hidden md:block absolute -top-14 right-[5.5rem]">
						<line x1="1" y1="0" x2="1" y2="56" stroke="#6ee7b7" strokeWidth="2" />
					</svg>

					<SketchyButton
						variant="shadow"
						bg="#58d1b7d9"
						hoverBg="#1ea58893"
						borderColor="#177863ff"
						onClick={() => onStartMatch?.(match)}
						disabled={!isMatchPlayable(match, 1, idx)}
						className={`
							${match.status === "finished"
								? "text-gray-400 cursor-not-allowed"
								: !isMatchPlayable(match, 1, idx)
									? "text-gray-400 cursor-not-allowed"
									: "text-white hover:bg-indigo-700"
							}
						`}
					>
						{t("tournament.playMatch")} {idx + 1}
					</SketchyButton>
				</div>
			))}
		</div>

				{/* Cancel/Close Tournament*/}
				<div className="mt-8">
					{tournament.status === "finished" && (
						<SketchyButton
							variant="shadow"
							bg="#a48d988a"
							hoverBg="#a91a5f8a"
							borderColor="#a91a5f8a"
							className="text-white"
							onClick={onClose}
						>
							{t("tournament.close")}
						</SketchyButton >
					)}

					{tournament.status === "ongoing" && onCancel && (
						<SketchyButton
							variant="shadow"
							bg="#a48d988a"
							hoverBg="#a91a5f8a"
							borderColor="#a91a5f8a"
							className="text-white"
							onClick={onCancel}
						>
							{t("tournament.cancel")}
						</SketchyButton>
					)}
				</div>
			
		</div>
	);
}
export default TournamentBracket;