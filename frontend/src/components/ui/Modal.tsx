import React, { useState } from "react";
import Button from "./Button";
import { useTranslation } from "../../shared/Translation";
import { passthrough } from "msw";
import SketchyButton from "../ui/SketchyButtons";
import SketchyPanel from "../layout/SketchyPanel";


// Props interface for the Modal component
interface ModalProps {
	isOpen: boolean;      // Controls whether the modal is visible
	onClose: () => void;  // Callback to close the modal
	onFormSubmit: (data: {
		username: string;
		password: string;
	}) => void;            // Callback to send the registration data to parent
	mode?: "register" | "login"; // new prop to indicate mode
	error?: string | null;  // backend error
	inlineErrors?: { username?: string; password?: string };  // frontend error
}

const Modal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	onFormSubmit,
	mode = "register",
	error,
	inlineErrors = {},
}) => {
	const { t } = useTranslation();

	// Local state to track form inputs
	const [username, setUsername] = useState("");            // Username input
	const [password, setPassword] = useState("");            // Password input

	React.useEffect(() => {
		if (!isOpen) {
			setUsername("");
			setPassword("");
		}
	}, [isOpen]);
	// If modal is not open, don't render anything
	if (!isOpen) return null;

	const title =
		mode === "login" ? t("auth.title.login") : t("auth.title.register");
	const buttonText =
		mode === "login" ? t("auth.action.login") : t("auth.action.register");


	// Handles form submission
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Calls parent's onSubmit callback with form data
		onFormSubmit({
			username,
			password
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose} />

			<SketchyPanel
				className= "
					relative 
					w-[90%]
					max-w-[18rem]    /* base max for mobile */
					sm:max-w-[20rem] /* medium screens */
					md:max-w-[24rem] /* larger screens */
					lg:max-w-[28rem] /* desktop */
					xl:max-w-[30rem] /* very large screens */

					min-h-[18rem]
					sm:min-h-[20rem]
					md:min-h-[22rem]
					lg:min-h-[24rem]
				"
				bg="#6C0E42"
				stroke="#FFFCC7"
				padding="0.25rem"
				borderRadius="20px"
			>
				<div className="text-[#FFFCC7]">
					<div className="px-12 pt-16">
						<h2 className="font-cupcake text-2xl"
							style={{ textShadow: `
										-3px 0 #000,
										3px 0 #000,
										0 3px #000,
										0 -3px #000`}}>{title}
						</h2>
					</div>
					<form className="pl-12 pr-14 pb-10 pt-12 space-y-6" onSubmit={handleSubmit}>
						{/* Username input */}
						<div>
							<input
								type="text"
								placeholder={t("auth.placeholder.username")}
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full h-[3rem] sketch-border border-[#FFFCC7] font-body bg-gray-800/60 
										px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#58d1b7]"
								required
							/>
						</div>

					{/* Password input */}
					<div>
						<input
							type="password"
							placeholder={t("auth.placeholder.password")}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full h-[3rem] sketch-border border-[#FFFCC7] font-body bg-gray-800/60 
									px-2 py-2 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#58d1b7]"
							required
						/>
						{inlineErrors.username && (
							<p className="text-sm sm:text-medium text-[#FFFCC7] mt-3 pl-2">
								{inlineErrors.username}
							</p>
						)}
						{inlineErrors.password && (
							<p className="text-sm sm:text-medium text-[#FFFCC7] mt-3 pl-2">
								{inlineErrors.password}
							</p>
						)}
						{/* Backend error (only shown if no inline errors) */}
							{!inlineErrors.username && !inlineErrors.password && error && (
								<p className="text-sm sm:text-medium text-[#FFFCC7] mt-3 pl-2">{error}</p>
							)}
					</div>

					{/* Submit and Close buttons */}
					<div className="flex items-center justify-center gap-8 text-white pt-10">
						<SketchyButton
							variant="shadow"
							bg="#a48d988a"
							hoverBg="#a91a5f8a"
							borderColor="#a91a5f8a"
							className="text-lg"
							onClick={onClose}
						>
							{t("common.close")}
						</SketchyButton>
						<SketchyButton
							variant="shadow"
							bg="#58d1b7d9"
							hoverBg="#1ea58893"
							borderColor="#177863ff"
							className="text-lg"
							>
								{buttonText}
						</SketchyButton>
						
				</div>
			</form>
		</div>
		</SketchyPanel>
	</div>
	);
};

export default Modal;
