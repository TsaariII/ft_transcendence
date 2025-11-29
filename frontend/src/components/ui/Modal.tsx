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
					max-w-[22rem]    /* base max for mobile */
					sm:max-w-[24rem] /* medium screens */
					md:max-w-[28rem] /* larger screens */
					lg:max-w-[32rem] /* desktop */
					xl:max-w-[34rem] /* very large screens */

					min-h-[20rem]
					sm:min-h-[22rem]
					md:min-h-[24rem]
					lg:min-h-[26rem]
				"
				bg="#6C0E42"
				stroke="#FFFCC7"
				padding="0.25rem"
				borderRadius="20px"
			>
				<div className="text-[#FFFCC7]">
					<div className="px-12 pt-16">
						<h2 className="font-cupcake text-4xl"
							style={{ textShadow: `
										-3px 0 #000,
										3px 0 #000,
										0 3px #000,
										0 -3px #000`}}>{title}
						</h2>
					</div>
					<form className="pl-12 pr-14 pb-10 pt-12 space-y-6 text-2xl" onSubmit={handleSubmit}>
						{/* Username input */}
						<div>
							<input
								type="text"
								placeholder={t("auth.placeholder.username")}
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full h-[4rem] sketch-border border-[#FFFCC7] font-body bg-gray-800/60 
										px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#3F839C]"
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
							className="w-full h-[4rem] sketch-border border-[#FFFCC7] font-body bg-gray-800/60 
									px-2 py-2 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#3F839C]"
							required
						/>
						{inlineErrors.username && (
							<p className="text-lg text-[#FFFCC7] mt-3 pl-2">
								{inlineErrors.username}
							</p>
						)}
						{inlineErrors.password && (
							<p className="text-lg text-[#FFFCC7] mt-3 pl-2">
								{inlineErrors.password}
							</p>
						)}
						{/* Backend error (only shown if no inline errors) */}
							{!inlineErrors.username && !inlineErrors.password && error && (
								<p className="text-lg text-[#FFFCC7] mt-3 pl-2">{error}</p>
							)}
					</div>

					{/* Submit and Close buttons */}
					<div className="flex justify-between items-center pl-8 pr-8 pt-10">
						<SketchyButton
							variant="shadow"
							className="text-xl"
							bg="#7C5483"
							hoverBg="#3A1C4B"
							type="button"
							onClick={onClose}
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
