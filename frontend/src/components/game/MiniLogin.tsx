import React, { useState } from "react";
import { useTranslation } from "../../shared/Translation";
import SketchyButton from "../ui/SketchyButtons";
import SketchyPanel from "../layout/SketchyPanel";
import { useAuth } from "../../context/AuthContext";

interface MiniLoginProps {
		gameId:string;
		onLoginSuccess: (player2Token: string) => void;
		onCancel: () => void;
}

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{5,11}$/;  // 6–12 chars
const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_\-+=.]{8,16}$/; // 8–16 chars

const MiniLogin: React.FC<MiniLoginProps> = ({gameId, onLoginSuccess, onCancel }) => {
		const { t } = useTranslation();
		const { user } = useAuth(); // currently logged-in user

		const [username, setUsername] = useState("");
		const [password, setPassword] = useState("");
		const [loading, setLoading] = useState(false);
		const [error, setError] = useState<string | null>(null);

		// Field-specific errors
		const [errors, setErrors] = useState<{
			username?: string;
			password?: string;
		}>({});

		const validateFrontend = () => {
			const newErrors: typeof errors = {};

			if (!PASSWORD_REGEX.test(password.trim()) || !USERNAME_REGEX.test(username.trim())) {
				newErrors.password = t("auth.error.invalidCredentials");
			}
			// Frontend check: prevent logging in as already logged-in user
			if (user?.username && username.trim() === user.username) {
				newErrors.password = t("auth.error.alreadyLoggedIn");
			}

			setErrors(newErrors);
			setError(null);

			return Object.keys(newErrors).length === 0;
		};

		const handleSubmit = async (e: React.FormEvent) => {
			e.preventDefault();
			setLoading(true);
			setErrors({});

			if (!validateFrontend()) {
				setLoading(false);
				return;
			}

		try {
			const res = await fetch("/api/join-game", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					gameId,
					type: "login",
					username,
					password,
					mode: "local",
					player_count: 2,
				}),
			});


			 if (res.status === 400) {
				const data = await res.json().catch(() => null);
				setError(t("auth.error.invalidCredentials"));
				return;
			}

			// Handle other non-OK responses
			if (!res.ok) {
				const text = await res.text().catch(() => "Unknown error");
				throw new Error(text);
			}

			const data = await res.json();
			onLoginSuccess(data.playerToken);

		} catch (err: any) {
			setError(err?.message || t("auth.error.secondPlayerLoginFailed") );
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onCancel}
			/>
			<SketchyPanel
				className="relative w-[90%] max-w-[20rem] sm:max-w-[22rem] md:max-w-[26rem] lg:max-w-[30rem] 
						xl:max-w-[32rem] min-h-[18rem] sm:min-h-[20rem] md:min-h-[22rem] lg:min-h-[24rem]"
				bg="#6C0E42"
				stroke="#FFFCC7"
				padding="0.25rem"
				borderRadius="20px"
			>
				<div className="text-[#FFFCC7]">
					<div className="px-12 pt-16">
						<h2 className="font-cupcake text-2xl text-center"
							style={{
								textShadow: `
								-3px 0 #000,
								3px 0 #000,
								0 3px #000,
								0 -3px #000`,
							}}
						>
							{t("auth.loginAsPlayer2")}
						</h2>
					</div>

					<form className="pl-12 pr-14 pb-10 pt-12 space-y-6" onSubmit={handleSubmit}>
						{/* Username */}
						<div>
							<input
								type="text"
								placeholder={t("auth.placeholder.username")}
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full h-[3rem] sketch-border border-[#FFFCC7] font-body
										bg-gray-800/60 px-3 py-2 placeholder-gray-400 focus:outline-none
										focus:ring-4 focus:ring-[#3F839C]"
								required
							/>
							{errors.username && (
								<p className="text-lg text-[#FFFCC7] mt-3 pl-2">{errors.username}</p>
							)}
						</div>

						{/* Password */}
						<div>
							<input
								type="password"
								placeholder={t("auth.placeholder.password")}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full h-[3rem] sketch-border border-[#FFFCC7] font-body
										bg-gray-800/60 px-3 py-2 placeholder-gray-400 focus:outline-none
										focus:ring-4 focus:ring-[#3F839C]"
								required
							/>
							{errors.password && (
								<p className="text-medium text-[#FFFCC7] mt-3 pl-2">{errors.password}</p>
							)}
						</div>

						{/* Backend error */}
						{error && <p className="text-medium text-[#FFFCC7] mt-3 pl-2">{error}</p>}

						{/* Buttons */}
						<div className="flex justify-between items-center text-black pl-8 pr-8 pt-10">
							<SketchyButton
								variant="shadow"
								bg="#a48d988a"
								hoverBg="#a91a5f8a"
								borderColor="#a91a5f8a"
								onClick={onCancel}
							>
								{t("common.close")}
							</SketchyButton>
							<SketchyButton
								variant="shadow"
								bg="#58d1b7d9"
								hoverBg="#1ea58893"
								borderColor="#177863ff"
							>
								{loading ? t("auth.loggingIn") : t("auth.logIn")}
							</SketchyButton>
						</div>
					</form>
				</div>
			</SketchyPanel>
		</div>
	);
};

export default MiniLogin;
