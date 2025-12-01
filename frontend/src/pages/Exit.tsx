import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CenteredContainer from "../components/layout/CenteredContainer";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../shared/Translation";

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
		<CenteredContainer>
			<div className="w-full flex flex-col items-center px-6 py-6">
				<div className="w-full max-w-5xl relative mx-auto mb-4 p-6 border-4 border-[#FFFCC7] bg-[#D54751]"
          			style={{
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
							{t("exit.title")}
						</h1>
					</div>
				</div>

				<div className="w-full flex flex-col relative z-0 mx-auto mb-4 px-1 p-6 border-4 border-[#FFFCC7] bg-[#D54751]"
          			style={{
            			borderRadius: '60px',
            			boxShadow: '4px 6px 0 rgba(89,50,43, 0.9)',
            			transform: 'rotate(-0.4deg)',
          			}}>

					<div className="text-center px-2">
						{err && (
							<p className="mb-3 text-sm font-body text-[#FFFCC7] bg-[#C04D57] border-2 border-[#59322B] rounded-2xl px-3 py-2 inline-block shadow-[2px_3px_0_#59322B]">
								{err}
							</p>
						)}

				{done ? (
					// Case 1: user just logged out
					<>
						<p className="font-body text-[#FFFCC7] mb-1">{t("exit.loggedOut")}</p>
						<p className="font-body text-sm text-[#FFFCC7]/90">{t("exit.redirectHome")}</p>
					</>
				) : sessionExpired ? (
					// Case 2: session expired
					<>
						<p className="font-body text-[#FFFCC7] mb-1">{t("exit.sessionExpired")}</p>
						<p className="font-body text-sm text-[#FFFCC7]/90">{t("exit.redirectHome")}</p>
					</>
				) : arrivedLoggedOut ? (
					// Case 3: user opened exit while logged out
					<>
						<p className="font-body text-[#FFFCC7] mb-1">{t("exit.alreadyLoggedOut")}</p>
						<p className="font-body text-sm text-[#FFFCC7]/90">{t("exit.loginPrompt")}</p>
						<button
							type="button"
							onClick={() => navigate("/")}
							className="font-body mt-1 px-5 py-2 text-sm rounded-xl font-body tracking-wide bg-[#FFFCC7] text-[#59322B] shadow-[3px_4px_0_#59322B] hover:translated-y-[1px] hover:shadow-[2px_3px_0_#59322B]"
						>
							{t("nav.home")}
						</button>
					</>
				) : (
					// Case 4: user is logged in and wants to log out
					<>
						<p className="font-body text-[#FFFCC7] mb-3">
							{busy ? t("exit.loggingOut") : t("exit.goodbye")}
						</p>
						<button
							type="button"
							onClick={handleLogout}
							disabled={busy}
							className={
								"font-hand px-4 py-1.5 text-sm rounded-lg font-semibold  tracking-wide " +
								(busy
									? "bg-[#C04D57] text-[#FFFCC7] opacity-60 cursor-not-allowed" 
									: "bg-[#C04D57] text-[#FFFCC7] shadow-[3px_4px_0_#59322B] hover:translate-y-[1px] hover:shadow-[2px_3px_0_#59322B]")
							}
						>
							{busy ? t("exit.loggingOut") : t("nav.exit")}
						</button>
					</>
				)}
			</div>
			</div>
			</div>
		</CenteredContainer>
	);
};

export default Exit;
