import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { RegisterUserPayload } from "../../shared/payloads";
import { useAuth } from "../context/AuthContext";
import CenteredContainer from "../components/layout/CenteredContainer";
import AnimatedText from "../components/layout//AnimatedText";
import { useTranslation } from "../shared/Translation";
import { Gamepad2, Trophy, Users, ListOrdered, Settings as SettingsIcon } from "lucide-react";
import DoodleButton from "../components/ui/DoodleButton";
import SketchyButton from "../components/ui/SketchyButtons";
import SketchyPanel from "../components/layout/SketchyPanel";
import arcade from "../assets/doodles/arcade.png";
import podium from "../assets/doodles/podium.png";
import trophy2 from "../assets/doodles/trophy2.png";
import telly from "../assets/doodles/telly.png";
import collection from "../assets/doodles/collection.png";
import { ArcadeFrame } from "../components/layout/ArcadeFrame";

const setServerLang = (code: "en" | "fi" | "sv") => localStorage.setItem("serverLang", code);

console.log("arcade import is:", arcade);

const LanguageToggle: React.FC<{ compact?: boolean }> = ({ compact = true }) => {
	const { t, setLang } = useTranslation();
	const { isLoggedIn } = useAuth();

	async function changeLang(code: "en" | "fi" | "sv") {
		setLang(code);

		if (isLoggedIn) {
			try {
				await fetch(API_PROTOCOL.CHANGE_LANGUAGE.path, {
					method: API_PROTOCOL.CHANGE_LANGUAGE.method,
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ language: code }),
				});
				localStorage.setItem("serverLang", code);
			} catch {}
		}
	}

	const Btn = ({
		code,
		label,
		flag,
	}: {
		code: "en" | "fi" | "sv";
		label: string;
		flag: string;
	}) => (
		<button
			type="button"
			onClick={() => changeLang(code)}
			aria-label={label}
			className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-[#FFFCC7]
				hover:bg-[#58d1b7] border-2 border-black font-hand text-black
				shadow-[4px_4px_0_0_#000]"
		>
			<span className="text-xl">{flag}</span>
			{!compact && <span className="text-sm">{label}</span>}
		</button>
	);

	return (
		<div className="flex items-center gap-2">
			<Btn code="en" label={t("lang.english")} flag="🇬🇧" />
			<Btn code="fi" label={t("lang.finnish")} flag="🇫🇮" />
			<Btn code="sv" label={t("lang.swedish")} flag="🇸🇪" />
		</div>
	);
};

// Username: must start with letter, 6-12 chars, letters, numbers, underscore allowed
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{5,11}$/;

// Password: 8-16 chars, letters, numbers and allowed special chars
const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_\-+=.]{8,16}$/;

function validateRegisterInput(username: string, password: string, t: (k:string)=>string) {
	const errors: { username?: string; password?: string } = {};

	if (!USERNAME_REGEX.test(username)) { errors.username = t("auth.error.usernameFormat"); }

	if (!PASSWORD_REGEX.test(password)) { errors.password = t("auth.error.passwordFormat"); }
	return errors;
}

function validateLoginInput(username: string, password: string, t: (k:string)=>string) {
	const errors: { username?: string; password?: string } = {};

	if (!USERNAME_REGEX.test(username) || !password) {
		errors.username = t("auth.error.invalidCredentials");
	}
	return errors;
}

const HomePage: React.FC = () => {
	const { t, lang, setLang } = useTranslation();
	const [isModalOpen, setIsModalOpen] = useState(false); // Tracks if modal is open
	const [modalMode, setModalMode] = useState<"login" | "register">("register"); // Mode of modal
	const navigate = useNavigate();
	const { isLoggedIn, user, refreshSession } = useAuth(); // Access authentication state and functions

	//Force english landing page when logged out
	const forcedOnce = useRef(false);
	useEffect(() => {
		if (!isLoggedIn && !forcedOnce.current) {
			forcedOnce.current = true;
			if (lang !== "en") {
				setLang("en");
				localStorage.setItem("anonLang", "en");
			}
		}
	}, [isLoggedIn]);

	//2FA states
	const [is2faStep, setIs2faStep] = useState(false);
	const [tempAuthToken, setTempAuthToken] = useState<string | null>(null);
	const [otp, setOtp] = useState("");

	// errors
	const [inlineErrors, setInlineErrors] = useState<{ username?: string; password?: string }>({});
	const [formError, setFormError] = useState<string | null>(null);

	// Generic form submit handler for registration or login
	const handleSubmit = async (data: RegisterUserPayload) => {
		setFormError(null);
		setInlineErrors({});

		let errors: { username?: string; password?: string } = {};

		if (modalMode === "register") {
			errors = validateRegisterInput(data.username, data.password, t);
	
		} else {
			errors = validateLoginInput(data.username, data.password, t);
		}

		if (Object.keys(errors).length > 0) {
				setInlineErrors(errors);
				return;
		}

		const endpoint =
			modalMode === "register" ? API_PROTOCOL.REGISTER_USER : API_PROTOCOL.LOGIN_USER;
		
		type RegisterPayload = RegisterUserPayload & { language?: "en" | "fi" | "sv" };
		const payload =
			modalMode === "register"
				? ({ ...data, language: lang } as RegisterUserPayload)
				: data;

		try {
			const res = await fetch(endpoint.path, {
				method: endpoint.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				credentials: "include", // include cookies in request
			});
			console.log("res", res);

			const resData = await res.json();
			console.log("Backend error:", resData);

			if (res.status === 202) {
				setTempAuthToken(resData.tempAuthToken);
				setIsModalOpen(false);
				setIs2faStep(true);
				return;
			}

			if (!res.ok ) {
				const backendError = resData?.error;
				switch (backendError) {
					case "DATABASE_ERROR":
						throw new Error(t("auth.error.loginFailed"));
					case "REGISTER_FAILED":
						throw new Error(t("auth.error.registerFailed"));
					case "Hash comparison failed":
						throw new Error(t("auth.error.serverError"));
					case "User not found":
						throw new Error(t("auth.error.invalidCredentials"));
					case "Invalid username or password":
						throw new Error(t("auth.error.invalidCredentials"));
					case "Username already taken":
						throw new Error(t("error.username.taken"));
					case "VALIDATION_ERROR":
						throw new Error(t("auth.error.invalidCredentials"));
					default:
						throw new Error(t("Could not log in, please try again later."));
				}
			}

			if (modalMode === "register") {
				try {
					await fetch(API_PROTOCOL.CHANGE_LANGUAGE.path, {
						method: API_PROTOCOL.CHANGE_LANGUAGE.method,
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({ language: lang }),
					});
					localStorage.setItem("serverLang", lang);
				} catch (_ ){}
			}

			await refreshSession();
			setIsModalOpen(false);

		} catch (err: any) {
			const message =
				err?.message || (typeof err === "string" ? err : t("home.error.generic"));
			setFormError(message);
		}
	};

	const handle2faVerifySubmit = async () => {
		if (!tempAuthToken || otp.length !== 6) {
			alert(t("home.2fa.codeInvalid"));
			return;
		}

		try {
			const res = await fetch(API_PROTOCOL.TFA_LOGIN_VERIFY.path, { // new endpoint for 2FA login
				method: API_PROTOCOL.TFA_LOGIN_VERIFY.method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ otp, tempAuthToken }),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error?.error || t("home.2fa.verifyFailed"));
			}

			await refreshSession();
			alert(t("home.alert.loginSuccess"));
			setIs2faStep(false); // hide 2FA modal
			setOtp("");
			setTempAuthToken(null);

		} catch (err: any) {
			alert(err?.message || t("home.error.generic"));
		}
	};

	return (
		<>
		<ArcadeFrame>
			<CenteredContainer>
				<div className="w-full max-w-md p-8 text-white flex flex-col items-center space-y-20">
					{/* Language flags */}
					{!isLoggedIn && (
						<div className="w-full flex justify-end">
							<LanguageToggle compact />
						</div>
					)}

					{!isLoggedIn && (
						<>
							<img
								src={collection}
							/>
							<div className="flex gap-10 font-cupcake sm:text-xl md:text-3xl text-[#FFFCC7]">
								<button
									className="hover:text-[#58d1b7]"
									style={{ textShadow: `
										-3px 0 #000,
										3px 0 #000,
										0 3px #000,
										0 -3px #000`}}
									onClick={() => {
										setModalMode("register");
										setIsModalOpen(true);
									}}
								>
									{t("home.cta.register")}
								</button>

								<button
									className="hover:text-[#58d1b7]"
									style={{ textShadow: `
										-3px 0 #000,
										3px 0 #000,
										0 3px #000,
										0 -3px #000`}}
									onClick={() => {
										setModalMode("login");
										setIsModalOpen(true);
									}}
								>
									{t("home.cta.login")}
								</button>
							</div>
						 </>
					)}
				</div>
				
				{isLoggedIn && (
					<div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
						{/* Tournament */}
						<DoodleButton
							imageSrc={trophy2}
							width="w-56"
							height="h-56"
							scale="scale-80"
							onClick={() => navigate("/tournament")}
							hoverText={t("home.icon.tournament")}
							hoverTextSize="text-3xl"
							strokeColor="#6ee7b7"
							animationDuration={200}
						/>

						{/* Game */}
						<DoodleButton	
							imageSrc={arcade}
							width="w-56"
							height="h-56"
							scale="scale-150"
							onClick={() => navigate("/game")}
							hoverText={t("home.icon.pong")}
							hoverTextSize="text-2xl"
							strokeColor="#6ee7b7"
							animationDuration={200}
						/>
						{/* Leaderboard */}
						<DoodleButton
							imageSrc={podium}
							width="w-56"
							height="h-56"
							onClick={() => navigate("/leaderboard")}
							hoverText={t("home.icon.leaderboard")}
							hoverTextSize="text-3xl"
							strokeColor="#6ee7b7"
							animationDuration={200}
						/>
					</div>
				)}
			<Modal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setFormError(null);
					setInlineErrors({});
				}}
				onFormSubmit={handleSubmit}
				mode={modalMode}
				error={formError}
				inlineErrors={inlineErrors}
			/>
			{is2faStep && (
			<div className="fixed inset-0 z-50 flex items-center justify-center">
				<div
					className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				/>
				<SketchyPanel
						className="relative w-[90%] max-w-[22rem] sm:max-w-[24rem] md:max-w-[28rem] lg:max-w-[32rem] 
									xl:max-w-[34rem] min-h-[20rem] sm:min-h-[22rem] md:min-h-[24rem] lg:min-h-[26rem]"
						bg="#6C0E42"
						stroke="#FFFCC7"
						padding="0.25rem"
						borderRadius="20px"
						>
						 <div className="text-[#FFFCC7] flex flex-col items-center px-12 pt-8">
							<h2 className="text-xl sm:text-2xl font-bold mb-2">{t("home.2fa.title")}</h2>
							<p className="pt-2 text-sm text-[#FFFCC7] mb-4">{t("home.2fa.instructions")}</p>
								
							<input
								type="text"
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								className="mt-1 lg:mt-6 mb-1 lg:mb-6 w-full max-w-[14rem] p-3 border border-gray-700 bg-gray-900 rounded-md
									text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#58d1b7]"
								maxLength={6}
								placeholder="123456"
							/>
								
							<SketchyButton
								variant="shadow"
								bg="#58d1b7d9"
								hoverBg="#1ea58893"
								borderColor="#177863ff"
								onClick={handle2faVerifySubmit}
								className="w-full max-w-[14rem] mt-2 px-6 py-2 text-white"
							>
								{t("home.2fa.verify")}
								
							</SketchyButton>
							<SketchyButton
								variant="shadow"
								bg="#a48d988a"
								hoverBg="#a91a5f8a"
								borderColor="#a91a5f8a"
								onClick={() => setIs2faStep(false)}
								className="w-full max-w-[14rem] mt-2 px-6 py-2 text-white"
								>
								{t("common.cancel")}
							</SketchyButton>
						</div>
					</SketchyPanel>
				</div>
			)}
		</CenteredContainer>
	</ArcadeFrame>
	</>
);
};

export default HomePage;
