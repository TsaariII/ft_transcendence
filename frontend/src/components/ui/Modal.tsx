import React, { useState } from "react";
import Button from "./Button";
import { useTranslation } from "../../shared/Translation";
import { passthrough } from "msw";
import SketchyButton from "../ui/SketchyButtons";


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
			<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

			<div className="relative w-[22rem] sm:w-[26rem] bg-black text-white sketch-border">

				<div className="px-5 pt-4">
					<h2 className="font-body text-lg">{title}</h2>
				</div>

			<form className="px-5 pb-5 pt-3 space-y-3" onSubmit={handleSubmit}>
				{/* Username input */}
				<div>
					<input
						type="text"
						placeholder={t("auth.placeholder.username")}
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="w-full sketch-border font-body bg-gray-800/60 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
					{inlineErrors.username && (
						<p className="text-xs text-red-400 mt-1">{inlineErrors.username}</p>
					)}
				</div>

				{/* Password input */}
				<div>
					<input
						type="password"
						placeholder={t("auth.placeholder.password")}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full sketch-border font-body bg-gray-800/60 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
					{inlineErrors.password && (
						<p className="text-xs text-red-400 mt-1">
							{inlineErrors.password}
						</p>
					)}
					{/* Backend error (only shown if no inline errors) */}
						{!inlineErrors.username && !inlineErrors.password && error && (
							<p className="text-xs text-red-400 mt-1">{error}</p>
						)}
				</div>

				{/* Submit and Close buttons */}
				<div className="flex justify-between items-center mt-4">
					<SketchyButton
						variant="striped"
						bg="#67A99E"
						hoverBg="#C8553E"
						type="submit"
						>
							{buttonText}
					</SketchyButton>
					<SketchyButton
						variant="striped"
						bg="#EF6D05"
						hoverBg="#611407"
						type="button"
						onClick={onClose}
					>
						{t("common.close")}
					</SketchyButton>
				</div>
			</form>
		</div>
	</div>
	);
};

export default Modal;
