import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CenteredContainer from "../components/layout/CenteredContainer";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../shared/Translation";
import { ArcadeFrame } from "../components/layout/ArcadeFrame";
import SketchyButton from "../components/ui/SketchyButtons";
import { GiExitDoor } from "react-icons/gi";
import { MdErrorOutline } from "react-icons/md";

const Exit: React.FC = () => {
	const { t } = useTranslation();
	const { isLoggedIn, logoutUser } = useAuth();
	const navigate = useNavigate();

	const [busy, setBusy] = useState(false);
	const [done, setDone] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const sessionExpired =
		new URLSearchParams(location.search).get("reason") === "sessionExpired";

	useEffect(() => {
		if (done || sessionExpired) {
		const timer = setTimeout(() => navigate("/"), 2500);
		return () => clearTimeout(timer);
		}
	}, [done, sessionExpired, navigate]);

	async function handleLogout() {
		try {
		setBusy(true);
		setErr(null);
		await logoutUser();
		setDone(true);
		} catch (e: any) {
		setErr(t("exit.error"));
		} finally {
		setBusy(false);
		}
	}

	const arrivedLoggedOut = !isLoggedIn && !done;

	return (
		<ArcadeFrame title={t("exit.title")}>
			<CenteredContainer>
				<div className="w-full mt-28 max-w-md p-8 flex flex-col items-center space-y-6 text-center bg-black/30 rounded-xl shadow-lg border border-white/20">
				{/* Icon */}
				<div className="text-6xl text-emerald-400">
					{err ? <MdErrorOutline /> : <GiExitDoor />}
				</div>

				{/* Error message */}
				{err && (
					<p className="text-red-400 font-body text-lg flex items-center gap-2">
					<MdErrorOutline className="text-2xl" />
					{err}
					</p>
				)}

				{/* Main status */}
				{done ? (
					<>
					<p className="font-body text-white text-lg">{t("exit.loggedOut")}</p>
					<p className="text-white/90">{t("exit.redirectHome")}</p>
					</>
				) : sessionExpired ? (
					<>
					<p className="font-body text-white text-lg">{t("exit.sessionExpired")}</p>
					<p className="text-white/90">{t("exit.redirectHome")}</p>
					</>
				) : arrivedLoggedOut ? (
					<>
					<p className="font-body text-white text-lg">{t("exit.alreadyLoggedOut")}</p>
					<p className="text-white/90">{t("exit.loginPrompt")}</p>
					<SketchyButton
						variant="shadow"
						bg="#58d1b7d9"
						hoverBg="#1ea58893"
						borderColor="#177863ff"
						onClick={() => navigate("/")}
						className="mt-2 px-6 py-2 text-white text-sm flex items-center gap-2 justify-center"
					>
						<GiExitDoor className="text-xl" />
						{t("nav.home")}
					</SketchyButton>
					</>
				) : (
					<>
					<p className="font-cupcake text-[#fffcc2] text-lg mb-2">
						{busy ? t("exit.loggingOut") : t("exit.goodbye")}
					</p>
					<SketchyButton
						variant="shadow"
						bg="#a48d988a"
						hoverBg="#a91a5f8a"
						borderColor="#a91a5f8a"
						onClick={handleLogout}
						disabled={busy}
						className={`px-6 py-2 text-sm text-white flex items-center gap-2 justify-center ${
						busy ? "opacity-60 cursor-not-allowed" : ""
						}`}
					>
						{busy ? t("exit.loggingOut") : t("nav.exit")}
					</SketchyButton>
					</>
				)}
				</div>
			</CenteredContainer>
		</ArcadeFrame>
	);
};

export default Exit;
