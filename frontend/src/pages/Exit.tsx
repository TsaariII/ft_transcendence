import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CenteredContainer from "../components/layout/CenteredContainer";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../shared/Translation";
import { ArcadeFrame } from "../components/layout/ArcadeFrame";
import SketchyButton from "../components/ui/SketchyButtons";

const Exit: React.FC = () => {
	const { t } = useTranslation();
	const { isLoggedIn, logoutUser } = useAuth();
	const navigate = useNavigate();
	

	const [busy, setBusy] = useState(false);
	const [done, setDone] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const sessionExpired = new URLSearchParams(location.search).get("reason") === "sessionExpired";

	useEffect(() => {
		if (done || sessionExpired) {  // <-- redirect also on session expired
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
		} catch (e:any) {
			setErr(t("exit.error"));
		} finally {
			setBusy(false);
		}
	}

	const arrivedLoggedOut = !isLoggedIn && !done;

		return (
			<ArcadeFrame title={t("exit.title")}>
				<CenteredContainer>
					<div className="w-full max-w-md p-8 text-white flex flex-col items-center space-y-6 text-center">
					{/* Inline status */}
					{err && <p className="text-center font-body mb-3 text-red-300">{err}</p>}

				{done ? (
					// Case 1: user just logged out
					<>
						<p className="font-body text-white text-lg mb-1">{t("exit.loggedOut")}</p>
						<p className="font-body text-lg text-white/90">{t("exit.redirectHome")}</p>
					</>
				) : sessionExpired ? (
					// Case 2: session expired
					<>
						<p className="font-body text-white text-lg mb-1">{t("exit.sessionExpired")}</p>
						<p className="font-body text-lg text-white/90">{t("exit.redirectHome")}</p>
					</>
				) : arrivedLoggedOut ? (
					// Case 3: user opened exit while logged out
					<>
						<p className="font-body text-white text-lg mb-1">{t("exit.alreadyLoggedOut")}</p>
						<p className="font-body text-lg text-white/90 mb-4">{t("exit.loginPrompt")}</p>
						<SketchyButton
							variant="shadow"
							bg="#58d1b7d9"
							hoverBg="#1ea58893"
							borderColor="#177863ff"
							onClick={() => navigate("/")}
							className="mt-2 px-6 py-2 text-white text-sm"
						>
							{t("nav.home")}
						</SketchyButton>
					</>
				) : (
					// Case 4: user is logged in and wants to log out
					<>
						<p className="font-body text-white text-lg mb-3">
							{busy ? t("exit.loggingOut") : t("exit.goodbye")}
						</p>
						<SketchyButton
							variant="shadow"
							bg="#a48d988a"
							hoverBg="#a91a5f8a"
							borderColor="#a91a5f8a"
							onClick={handleLogout}
							disabled={busy}
							className={
								"px-6 py-2 text-sm text-white " +
								(busy ? "opacity-60 cursor-not-allowd" : "")
							}
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
