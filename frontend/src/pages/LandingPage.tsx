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
import arcade from "../assets/doodles/arcade.png";
import podium from "../assets/doodles/podium.png";
import ArcadeIcon from "../assets/doodles/arcade.svg?react";

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
			className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700"
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

		let errors;

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
					case "Database error":
						throw new Error("Could not log in.");
					case "Hash comparison failed":
						throw new Error("Server error, please try again later.");
					case "User not found":
						throw new Error(t("auth.error.invalidCredentials"));
					case "Invalid password":
						throw new Error(t("auth.error.invalidCredentials"));
					case "Failed to add user":
						throw new Error(t("error.username.taken"));
					case "VALIDATION_FAILED":
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
		{/* Animated PONG text }
		<div className="absolute top-16 left-0 w-full flex justify-center z-10">
			<AnimatedText
			text={t("home.title")}
			strokeColor="white"
			strokeWidth={3}
			className="max-w-[800px]"
			/>
		</div> */}

		<CenteredContainer> 
		{/* Semi-transparent card wrapper for Home page content */}
		<div className="w-full max-w-md bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl flex flex-col items-center space-y-8">
			{/* Language flags */}
			{!isLoggedIn && (
				<div className="w-full flex justify-end">
					<LanguageToggle compact />
				</div>
			)}

			<h1 className="text-5xl font-hand">{t("home.title")}</h1>

			{!isLoggedIn && (
				<div className="flex gap-4">
					<button
						className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
						onClick={() => {
							setModalMode("register");
							setIsModalOpen(true);
						}}
					>
						{t("home.cta.register")}
					</button>

					<button
						className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition"
						onClick={() => {
							setModalMode("login");
							setIsModalOpen(true);
						}}
					>
						{t("home.cta.login")}
					</button>
				</div>
			)}
		</div>
		
			{isLoggedIn && (
				<div className="w-full max-w-2xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-3 gap-8 p-4 bg-transparent">

						{/* Game */}
						<DoodleButton
							icon={<ArcadeIcon className="w-full h-full stroke-black" />}
							hoverStrokeColor="stroke-red-500"
							width="w-52"
							height="h-52"
							onClick={() => navigate("/game")}
							rotate="-rotate-2"
							borderRadius="rounded-[25px_15px_28px_18px]"
						/>

						<DoodleButton
							icon={<Trophy strokeWidth={1} className="w-44 h-44 stroke-white" />}
							hoverStrokeColor="stroke-red-500"
							width="w-44"
							height="h-44"
							onClick={() => navigate("/tournament")}
							rotate="rotate-1.5"
							borderRadius="rounded-[18px_28px_15px_22px]"
						/>

						<DoodleButton
							icon={<Users size={64} strokeWidth={2.5} />}
							width="w-52"
							height="h-52"
							onClick={() => navigate("/friends")}
							rotate="-rotate-1"
							borderRadius="rounded-[22px_12px_26px_16px]"
						/>

						<DoodleButton
							imageSrc={podium}
							width="w-52"
							height="h-52"
							onClick={() => navigate("/leaderboard")}
							rotate="rotate-2"
							borderRadius="rounded-[15px_24px_18px_20px]"
						/>

						<DoodleButton
							icon={<SettingsIcon size={64} strokeWidth={2.5} />}
							width="w-52"
							height="h-52"
							onClick={() => navigate("/settings")}
							rotate="-rotate-1.5"
							borderRadius="rounded-[20px_16px_22px_14px]"
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
		<div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
			<div className="w-full max-w-md bg-gray-900/90 border border-gray-700 rounded-xl p-6 text-white shadow-2xl">
				<h2 className="text-2xl font-bold mb-2">{t("home.2fa.title")}</h2>
				<p className="text-sm text-gray-300 mb-4">{t("home.2fa.instructions")}</p>
				<input
					type="text"
					value={otp}
					onChange={(e) => setOtp(e.target.value)}
					className="w-full p-3 border border-gray-700 bg-gray-900 rounded-md text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600"
					maxLength={6}
					placeholder="123456"
				/>
				<button
					onClick={handle2faVerifySubmit}
					className="w-full mt-4 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition"
					
				>
					{t("home.2fa.verify")}
				</button>
				<button
					onClick={() => setIs2faStep(false)}
					className="w-full mt-2 px-6 py-3 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
					>
					{t("common.cancel")}
				</button>
			</div>
		</div>
	)}
	</CenteredContainer> 
	</>
);
};

export default HomePage;
