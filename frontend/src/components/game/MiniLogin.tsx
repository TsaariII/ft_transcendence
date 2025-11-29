import React, { useState } from "react";
import { useTranslation } from "../../shared/Translation";
import SketchyButton from "../ui/SketchyButtons";
import SketchyPanel from "../layout/SketchyPanel";

interface MiniLoginProps {
		gameId:string;
		onLoginSuccess: (player2Token: string) => void;
		onCancel: () => void;
}

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{5,11}$/;  // 6–12 chars
const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_\-+=.]{8,16}$/; // 8–16 chars

const MiniLogin: React.FC<MiniLoginProps> = ({gameId, onLoginSuccess, onCancel }) => {
		const { t } = useTranslation();
		const [username, setUsername] = useState("");
		const [password, setPassword] = useState("");
		const [loading, setLoading] = useState(false);
		const [error, setError] = useState<string | null>(null);

		// Field-specific errors
		const [errors, setErrors] = useState<{
			username?: string;
			password?: string;
			general?: string;
		}>({});

		const validateFrontend = () => {
			const newErrors: typeof errors = {};

			if (!USERNAME_REGEX.test(username.trim())) {
				newErrors.username = t("auth.error.usernameFormat");
			}

			if (!PASSWORD_REGEX.test(password.trim())) {
				newErrors.password = t("auth.error.passwordFormat");
			}

			setErrors(newErrors);
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

			const data = await res.json();

			if (!res.ok || data.error) {
				throw new Error(data.error || t("error.auth.miniLoginFailed"));
			}
			
			onLoginSuccess(data.playerToken);
		} catch (err: any) {
			setErrors({ general: err?.message || t("auth.error.secondPlayerLoginFailed") });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onCancel}
			/>
			<SketchyPanel
				className="relative w-[90%] max-w-[22rem] sm:max-w-[24rem] md:max-w-[28rem] lg:max-w-[32rem] 
						xl:max-w-[34rem] min-h-[20rem] sm:min-h-[22rem] md:min-h-[24rem] lg:min-h-[26rem]"
				bg="#6C0E42"
				stroke="#FFFCC7"
				padding="0.25rem"
				borderRadius="20px"
			>
				<div className="text-[#FFFCC7]">
					<div className="px-12 pt-16">
						<h2 className="font-cupcake text-4xl text-center"
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

					<form className="pl-12 pr-14 pb-10 pt-12 space-y-6 text-2xl" onSubmit={handleSubmit}>
						{/* Username */}
						<div>
							<input
								type="text"
								placeholder={t("auth.placeholder.username")}
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full h-[4rem] sketch-border border-[#FFFCC7] font-body
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
								className="w-full h-[4rem] sketch-border border-[#FFFCC7] font-body
										bg-gray-800/60 px-3 py-2 placeholder-gray-400 focus:outline-none
										focus:ring-4 focus:ring-[#3F839C]"
								required
							/>
							{errors.password && (
								<p className="text-lg text-[#FFFCC7] mt-3 pl-2">{errors.password}</p>
							)}
						</div>

						{/* Backend error */}
						{error && <p className="text-lg text-[#FFFCC7] mt-3 pl-2">{error}</p>}

						{/* Buttons */}
						<div className="flex justify-between items-center pl-8 pr-8 pt-10">
							<SketchyButton
								variant="shadow"
								className="text-xl"
								bg="#7C5483"
								hoverBg="#3A1C4B"
								type="button"
								onClick={onCancel}
							>
								{t("common.close")}
							</SketchyButton>
							<SketchyButton
								variant="shadow"
								className="text-xl"
								bg="#3F839C"
								hoverBg="#125a74"
								type="submit"
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
