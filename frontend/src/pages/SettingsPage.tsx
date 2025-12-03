import React, { useEffect, useRef, useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import { useTranslation } from "../shared/Translation";
import { useAuth } from "../context/AuthContext";
import { useApiFetch } from "../utils/apiFetch";

import type {
	ChangeLanguagePayload,
	ChangeUsernamePayload,
	ChangePasswordPayload,
	UpdateProfilePayload,
	UploadAvatarResponse,
} from "../../shared/payloads";
import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";
import defaultAvatar from "../assets/avatars/default-avatar.png";
import DoodleButton from "../components/ui/DoodleButton";
import profile from "../assets/doodles/profile.png";
import { ArcadeFrame } from "../components/layout/ArcadeFrame";
import CenteredContainer from "../components/layout/CenteredContainer";
import SketchyButton from "../components/ui/SketchyButtons";
import { GrLanguage } from "react-icons/gr";
import { FaUserAltSlash } from "react-icons/fa";
import { TbPassword } from "react-icons/tb";
import { RxAvatar } from "react-icons/rx";
import { Si2Fas } from "react-icons/si";
import { FaUser } from "react-icons/fa";

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{5,11}$/;
const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_\-+=.]{8,16}$/;

const availableAvatars = [defaultAvatar, avatar1, avatar2, avatar3, avatar4];

type Row = "language" | "username" | "password" | "avatar" | "twofa" | "delete" | null;

const SettingsPage: React.FC = () => {
	const { t, setLang } = useTranslation();
	const {isLoggedIn, user, loading, refreshSession } = useAuth();

	// Which row is open state
	const [openRow, setOpenRow] = useState<Row>(null);

	// Inline status
	const [msg, setMsg] = useState<string | null>(null);
	const [err, setErr] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	// Forms
	const [language, setLanguage] = useState<"en" | "fi" | "sv">("en");
	const [username, setUsername] = useState("");
	const [usernameInput, setUsernameInput] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmNewPassword, setConfirmNewPassword] = useState("");
	const [selectedAvatar, setSelectedAvatar] = useState<string>(availableAvatars[0]);
	const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
	const [avatarDirty, setAvatarDirty] = useState(false);

	//Upload avatar
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [uploadPreview, setUploadPreview] = useState<string | null>(null);
	const [uploadBusy, setUploadBusy] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 2FA state
	const [twoFactor, setTwoFactor] = useState(false);
	const [qrCode, setQrCode] = useState<string | null>(null);
	const [otp, setOtp] = useState<string>("");
	const [showDisableConfirm, setShowDisableConfirm] = useState(false);

	// Delete Profile state
	const [deleting, setDeleting] = useState(false);
	const [deleted, setDeleted] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState(false);

	// Use apiFetch hook
	const apiFetch = useApiFetch();

	// Inline error state
	const [inlineErrors, setInlineErrors] = useState<{ username?: string; password?: string }>({});

	function validateUsernameInput(input: string) {
		const errors: { username?: string } = {};

		if (!USERNAME_REGEX.test(input)) {
			errors.username = t("auth.error.usernameFormat");
		}
		return errors;
	}

	function validatePasswordInputs(current: string, next: string, confirm: string) {
		const errors: { password?: string } = {};

		if (!PASSWORD_REGEX.test(next)) {
			errors.password = t("auth.error.passwordFormat");
			return errors;
		}

		if (next !== confirm) {
			errors.password = t("error.password.match");
		}
		if (!current) {
			errors.password = t("error.password.required");
		}
		return errors;
	}

	useEffect(() => {

	const fetch2faStatus = async () => {
		try {
		const res = await fetch(API_PROTOCOL.TFA_STATUS.path, {
			method: API_PROTOCOL.TFA_STATUS.method,
			credentials: "include"
		});
		const data = await res.json();
		setTwoFactor(data.isEnabled);
		} catch (err) {
		console.error("Failed to fetch 2FA status", err);
		setTwoFactor(false);
		}
	};

	if (user) {
		fetch2faStatus();
		setUsername(user.username || "");
		const avatar = user.avatarFile || availableAvatars[0];
		setCurrentAvatar(avatar);
		setSelectedAvatar(avatar);
	}
	}, []);

	if (loading) {
		return <div className="p-6 text-center text-gray-300">{t("settings.loading")}</div>;
	}
	if (!isLoggedIn) {
		return <div className="p-6 text-center text-gray-300">{t("settings.loginRequired")}</div>;
	}

	// Clear forms
	function resetUsernameForm() {
		setUsername("");
		setUsernameInput("");
	}

	function resetPasswordForm() {
		setCurrentPassword("");
		setNewPassword("");
		setConfirmNewPassword("");
	}

	function resetAvatarForm() {
		try {
			if (uploadPreview && uploadPreview.startsWith("blob:")) {
				URL.revokeObjectURL(uploadPreview);
			}
		} catch (_) { }

		setUploadPreview(null);
		setUploadFile(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
		if (selectedAvatar !== currentAvatar) {
			setSelectedAvatar(currentAvatar ?? availableAvatars[0]);
		}
	}

	function reset2faForm() {
		setQrCode(null);
		setOtp("");
		setShowDisableConfirm(false);
	}

	function closeAndReset(row: Exclude<Row, null>) {
		if (row === "username") resetUsernameForm();
		if (row === "password") resetPasswordForm();
		if (row === "avatar") resetAvatarForm();
		if (row === "twofa") reset2faForm();
		setOpenRow(null);
		setInlineErrors({});
	}

	function onCancelAvatar() {
		if (avatarDirty) {
			resetAvatarForm();
		}
		setOpenRow(null);
	}

	// Set row state (if same row clicked again, it closes it)
	function toggle(row: Exclude<Row, null>) {
		setMsg(null);
		setErr(null);
		setInlineErrors({});

		if (openRow === "avatar" && row !== "avatar") {
			if (avatarDirty) resetAvatarForm();
		}

		if (openRow === row) {
			if (row === "avatar" && avatarDirty) resetAvatarForm();
			setOpenRow(null);
			return;
		}

		if (openRow === "username") setUsernameInput("");
		if (openRow === "password") resetPasswordForm();
		if (openRow === "avatar") resetAvatarForm();
		if (openRow === "twofa") reset2faForm();

		if (row === "avatar") {
			if (currentAvatar) setSelectedAvatar(currentAvatar);
			setAvatarDirty(false);
		}
		if (row === "username") {
			setUsernameInput("");
		}
		if (row === "password") {
			resetPasswordForm();
		}
		if (row === "twofa") reset2faForm();

		setOpenRow(row);
	}

	// Upload avatar
	function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0] || null;
		setMsg(null);
		setErr(null);
		if (uploadPreview && uploadPreview.startsWith("blob:")) URL.revokeObjectURL(uploadPreview);

		if (!f) {
			setUploadFile(null);
			setUploadPreview(null);
			markAvatarDirty(selectedAvatar, null, null);
			return;
		}

		const okType = ["image/png", "image/jpeg", "image/webp"].includes(f.type);
		if (!okType) { 
			setErr(t("error.avatar.type"));
			setUploadFile(null);
			setUploadPreview(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			markAvatarDirty(selectedAvatar, null, null);
			return; 
		}

		const maxBytes = 2 * 1024 * 1024;
		if (f.size > maxBytes) {
			setErr(t("error.avatar.tooLarge"));
			setUploadFile(null);
			setUploadPreview(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			markAvatarDirty(selectedAvatar, null, null);
			resetFileInput();
			return;
		}

		const url = URL.createObjectURL(f);
		setUploadFile(f);
		setUploadPreview(url);
		markAvatarDirty(selectedAvatar, f, url);
	}

	function clearPickedFile() {
		if (uploadPreview && uploadPreview.startsWith("blob:")) {
			URL.revokeObjectURL(uploadPreview);
		}
		setUploadPreview(null);
		setUploadFile(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
		markAvatarDirty(selectedAvatar, null, null);
	}

	function resetFileInput() {
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	function onCancelAvatarClick() {
		resetAvatarForm();
		setOpenRow(null);
	}

	function markAvatarDirty(
		nextSelected= selectedAvatar,
		nextUploadFile: File | null = uploadFile,
		nextUploadPreview = uploadPreview
	) {
		const hasBlobPreview = !!nextUploadPreview && nextUploadPreview.startsWith("blob:");
		setAvatarDirty(nextSelected !== currentAvatar || !!nextUploadFile || hasBlobPreview);
	}

	async function saveLanguage() {
		setBusy(true);
		setMsg(null);
		setErr(null);

		try {
			const payload: ChangeLanguagePayload = { language };
			
			const data  = await apiFetch(
				API_PROTOCOL.CHANGE_LANGUAGE.path,
				{
					method: API_PROTOCOL.CHANGE_LANGUAGE.method,
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);

			if (data.status !== "UPDATED") {
				console.error("language update error:", data.error);
				setErr(t("error.language.updateFailed"));
				return;
			}
			setLang(language);	
			localStorage.setItem("serverLang", language);
			setOpenRow(null);
			await refreshSession();
			//setMsg(t("common.language.updated"));

		} catch (e: any) {
			if (e.sessionExpired) return; // let apiFetch handle redirect on 401
			setErr(t("error.language.updateFailed"));
		} finally {
			setBusy(false);
		}
	}

	async function saveUsername() {
		setBusy(true); setMsg(null); setErr(null);
		try {
			const value = usernameInput.trim();
			const validation = validateUsernameInput(value);
			if (validation.username) {
				setInlineErrors(validation);
				return;
			}
			setInlineErrors({});

			const payload: ChangeUsernamePayload = { username: value };
			const data = await apiFetch(API_PROTOCOL.CHANGE_USERNAME.path, {
					method: API_PROTOCOL.CHANGE_USERNAME.method,
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
			});
			console.log("Backend response for saveUsername:", data);

			setMsg(t("common.username.updated"));
			resetUsernameForm();
			setUsernameInput("");
			setOpenRow(null);

			await refreshSession();
			setUsername(value);

		} catch (e: any) {
			console.error("Caught error in saveUsername:", e);
			let backendError;
			try {
				backendError = JSON.parse(e.message);
			} catch (_) {
				backendError = { error: e.message };
			}

			if (backendError.error === "Username not available" || backendError.error === "username not available") {
				// Inline error under input
				setInlineErrors({ username: t("error.username.taken") });
			} else if (backendError.error === "no such user") {
				setErr(t("error.user.notFound"));
			} else if (e.sessionExpired) {
				return; // let apiFetch handle session expiration
			} else {
				setErr(t("error.username.updateFailed"));
			}
		} finally {
			setBusy(false);
	}
	}

	async function savePassword() {
		setBusy(true); setMsg(null); setErr(null);
		try {
			
			if (!PASSWORD_REGEX.test(currentPassword))
			{
				setInlineErrors({ password: t("auth.error.passwordFormat")});
				return;
			}

			const validation = validatePasswordInputs(
				currentPassword,
				newPassword,
				confirmNewPassword
			);
			
			if (validation.password) {
				setInlineErrors(validation);
				return;
			}
			setInlineErrors({});

			const payload: ChangePasswordPayload = {
				current_password: currentPassword,
				new_password: newPassword,
			};
		
			const data = await apiFetch(API_PROTOCOL.CHANGE_PASSWORD.path, {
				method: API_PROTOCOL.CHANGE_PASSWORD.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			setMsg(t("common.password.updated"));
			resetPasswordForm();
			setOpenRow(null);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmNewPassword("");

		} catch (e: any) {
			console.error("Caught error in savePassword:", e);

			let backendError;
			try {
				backendError = JSON.parse(e.message);
			} catch (_) {
				backendError = { error: e.message };
			}

			if (backendError.error === "Invalid password") {
				setInlineErrors({ password: t("error.password.currentIncorrect") });
			} else if (e.sessionExpired) {
				// Let apiFetch handle redirect
				return;
			} else {
				setErr(t("error.password.updateFailed"));
			}
		} finally {
			setBusy(false);
		}
	}

	async function saveAvatar() {
		setBusy(true); setMsg(null); setErr(null);
		try {
			const payload: UpdateProfilePayload = { avatar: selectedAvatar };
			const data = await apiFetch(
				API_PROTOCOL.CHANGE_AVATAR.path,
				{
					method: API_PROTOCOL.CHANGE_AVATAR.method,
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);

			if (data.status !== "UPDATED") {
				throw new Error(data.error || "Failed to update avatar.");
			}

			setCurrentAvatar(selectedAvatar);
			if (uploadPreview) {
				if (uploadPreview.startsWith("blob:")) URL.revokeObjectURL(uploadPreview);
				setUploadPreview(null);
			}
			setUploadFile(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			setMsg(t("common.avatar.updated"));
			setOpenRow(null);
			await refreshSession();
		} catch (e: any) {
			if (e.sessionExpired) return;
			setErr(t("error.avatar.updateFailed"));
		} finally {
			setBusy(false);
		}
	}

	async function uploadAvatarFile() {
		if (!uploadFile) return;
		setUploadBusy(true);
		setErr(null);
		setMsg(null);
		try {
			const fd = new FormData();
			fd.append("file", uploadFile); //backend read file

			const res = await fetch(API_PROTOCOL.UPLOAD_AVATAR.path, {
				method: API_PROTOCOL.UPLOAD_AVATAR.method,
				body: fd,
			});
			if (!res.ok) throw new Error("Failed to upload avatar.");

			const data = (await res.json()) as UploadAvatarResponse;
			if (data.status !== "UPLOADED" || !data.url) throw new Error(data.error || "Upload failed.");

			setSelectedAvatar(data.url);
			setCurrentAvatar(data.url);
			setUploadPreview(data.url);
			setUploadFile(null);
			if (fileInputRef.current) fileInputRef.current.value= "";

			setAvatarDirty(false);
			setMsg(t("common.avatar.updated"));
			setOpenRow(null);
			await refreshSession();
		} catch (e: any) {
			setErr(t("error.avatar.updateFailed"));
		} finally {
			setUploadBusy(false);
		}
	}

	//2FA handlers
	const handle2faCheckboxChange = async () => {
		setMsg(null);
		setErr(null);
		if (!twoFactor && !qrCode) { // enabling 2FA
			try {
				const res = await fetch(API_PROTOCOL.TFA_SETUP.path, {
					method: API_PROTOCOL.TFA_SETUP.method,
					credentials: "include"
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Could not start 2FA setup.");
				if (data.qrCodeUrl) { 
					setQrCode(data.qrCodeUrl);
					setMsg(t("settings.twofa.setupStarted"));
				} else {
					throw new Error("No QR code received.");
				}
			} catch (err: any) {
				//console.error("Failed to setup 2FA", err); alert(err.message || "Could not start 2FA setup.");
				setErr(t("error.twofa.setupFailed"));
			}
			return;
		}
		if (twoFactor) {
			setShowDisableConfirm(true);
		}
	};

	const cancel2faSetup = () => {
		setQrCode(null);
		setOtp("");
		setMsg(null);
		setErr(null);
		setTwoFactor(false);
	}

	const confirmDisable2fa = async () => {
		setBusy(true);
		setErr(null);
		setMsg(null);
		try {
				const res = await fetch(API_PROTOCOL.TFA_DISABLE.path, {
				method: API_PROTOCOL.TFA_DISABLE.method,
				credentials: "include"
			});
			const data = await res.json();
			if (!res.ok || !data.disabled) throw new Error(data.error || "Failed to disable 2FA.");
			setTwoFactor(false);
			setShowDisableConfirm(false);
			setMsg(t("common.twofa.disabled"));
			await refreshSession();
		} catch (err: any) {
			setErr(t("error.twofa.disableFailed"));
		} finally {
			setBusy(false);
		}
	};

	const cancelDisableConfirm = () => {
		setShowDisableConfirm(false);
	};

	const handleVerify2fa = async () => {
		setMsg(null);
		setErr(null);
		if (otp.length !== 6) { 
			//alert("Please enter a 6-digit code."); return;
			setErr(t("error.twofa.codeLength"));
			return;
		}
		try {
			const res = await fetch(API_PROTOCOL.TFA_VERIFY.path, {
				method: API_PROTOCOL.TFA_VERIFY.method,
				headers: { 'Content-Type': 'application/json' },
				credentials: "include",
				body: JSON.stringify({ otp })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to verify 2FA.");
			if (data.verified) { 
				//alert("2FA enabled successfully!");
				setTwoFactor(true);
				setQrCode(null);
				setOtp("");
				setOpenRow(null);
				setMsg(t("common.twofa.enabled"));
				await refreshSession();
			} else {
				//alert(data.error || "Invalid code, please try again.");
				setErr(t("error.twofaverifyFailed"));
			}
		} catch (_) {
			//alert(err.message || "Failed to verify 2FA.");
			setErr(t("error.twofa.verifyFailed"));
		}
	};

	async function handleDeleteProfile() {
		setDeleting(true);
		setDeleteError(null);
		try {
			const res = await fetch(API_PROTOCOL.DELETE_PROFILE.path, {
				method: API_PROTOCOL.DELETE_PROFILE.method,
				//headers: { "Content-Type": "application/json" },
				credentials: "include",
			});
			if (!res.ok) throw new Error("Failed to delete profile.");

			setDeleted(true);
			await refreshSession();
		} catch (err:any) {
			setDeleteError(t("error.delete.removeFailed"));
		} finally {
			setDeleting(false);
		}
	}

	const previewSrc = 
		currentAvatar ??
		uploadPreview ??
		selectedAvatar ??
		null;
				
return (
	<ArcadeFrame title={t("settings.title")}>
		<CenteredContainer>
			{/* Inline status */}
			{msg && <p className="text-center font-body mb-3 text-green-300">{msg}</p>}
			{err && <p className="text-center font-body mb-3 text-red-300">{err}</p>}

			{/* 3 x 2 doodle grid */}
			<section className ="flex justify-center mb-20">
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-6 justify-items-center">
				{/* Language row */}
				<DoodleButton
					icon={<GrLanguage size={88} />}
					rotate="-rotate-1"
					borderRadius="rounded-[22px_18px_26px_18px]"
					strokeColor="#6ee7b7"
					strokeWidth={2}
					animationDuration={200}
					hoverText={t("settings.title.language")}
					disableMovement={true}
					onClick={() => toggle("language")}
				/>
				{/* Username row */}
				<DoodleButton
					icon={<FaUser size={88} />}
					rotate="-rotate-1"
					borderRadius="rounded-[22px_18px_26px_18px]"
					strokeColor="#6ee7b7"
					strokeWidth={2}
					animationDuration={200}
					hoverText={t("settings.title.username")}
					disableMovement={true}
					onClick={() => toggle("username")}
				/>
				{/* Password row */}
				<DoodleButton
					icon={<TbPassword size={88} />}
					rotate="-rotate-1"
					borderRadius="rounded-[22px_18px_26px_18px]"
					strokeColor="#6ee7b7"
					strokeWidth={2}
					animationDuration={200}
					hoverText={t("settings.title.password")}
					disableMovement={true}
					onClick={() => toggle("password")}
				/>
				{/* Avatar row */}
				<DoodleButton
					icon={<RxAvatar size={88} />}
					rotate="-rotate-1"
					borderRadius="rounded-[22px_18px_26px_18px]"
					strokeColor="#6ee7b7"
					strokeWidth={2}
					animationDuration={200}
					hoverText={t("settings.title.avatar")}
					disableMovement={true}
					onClick={() => toggle("avatar")}
				/>
				{/* 2FA row */}
				<DoodleButton
					icon={<Si2Fas size={88} />}
					rotate="-rotate-1"
					borderRadius="rounded-[22px_18px_26px_18px]"
					strokeColor="#6ee7b7"
					strokeWidth={2}
					animationDuration={200}
					hoverText={t("settings.change2fa")}
					disableMovement={true}
					onClick={() => toggle("twofa")}
				/>
				{/* Delete row */}
				<DoodleButton
					icon={<FaUserAltSlash size={88} />}
					rotate="-rotate-1"
					borderRadius="rounded-[22px_18px_26px_18px]"
					strokeColor="#6ee7b7"
					strokeWidth={2}
					animationDuration={200}
					hoverText={t("settings.title.delete")}
					disableMovement={true}
					onClick={() => toggle("delete")}
				/>
			</div>
		</section>

		{openRow && (
			<div
				className="mx-auto p-12"
				style={{
					width: "90%",
					transform: "rotate(-0.3deg)",
				}}
			>

				{/* Language */}
				{openRow === "language" && (
					<div className="w-full max-w-md">
						<h2 
							className="mb-6 font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              				style={{ textShadow: `
                  				-3px 0 #000,
                  				3px 0 #000,
                  				0 3px #000,
                  				0 -3px #000,
                  				3px 3px #59322B,
                 				-3px -3px #59322B`
               				}}
						>
							{t("settings.item.language")}
						</h2>

						<select
							value={language}
							onChange={(e) => setLanguage(e.target.value as "en" | "fi" | "sv")}
							className="w-full maw-w-xs md-5 font-body placeholder-[#B088A3] bg-[#4A0A2E] text-[#FFFCC7] focus:ring-4 focus:ring-[#F472B6] focus-border-[#F0C4E0] rounded px-2 py-2 text-sm"
						>
							<option value="en">{t("lang.english")}</option>
							<option value="fi">{t("lang.finnish")}</option>
							<option value="sv">{t("lang.swedish")}</option>
						</select>
						<div className="mt-8 mb-3 flex gap-6">
							<PrimaryTiny className="order-2" onClick={saveLanguage} disabled={busy}>{t("common.save")}</PrimaryTiny>
							<SecondaryTiny className="order-1" onClick={() => closeAndReset("language")} disabled={busy}>{t("common.cancel")}</SecondaryTiny>
						</div>
					</div>
				)}

				{/* Username */}
				{openRow === "username" && (
					<div className="w-full max-w-md">
						<h2 
							className="mb-6 font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              				style={{ textShadow: `
                  				-3px 0 #000,
                  				3px 0 #000,
                  				0 3px #000,
                  				0 -3px #000,
                  				3px 3px #59322B,
                 				-3px -3px #59322B`
               				}}
						>
							{t("settings.item.newUsername")}
						</h2>
						<input
							type="text"
							name="settings-username"
							value={usernameInput}
							onChange={(e) => setUsernameInput(e.target.value)}
							className="w-full maw-w-xs md-5 font-body placeholder-[#B088A3] bg-[#4A0A2E] text-[#FFFCC7] focus:ring-4 focus:ring-[#F472B6] focus-border-[#F0C4E0] rounded px-2 py-2 text-sm"
							autoComplete="off"
						/>
						{/* Inline error shown under the input */}
						{inlineErrors.username && (
							<p className="mt-5 font-body text-white text-sm mt-1">{inlineErrors.username}</p>
						)}

						<div className="mt-8 mb-3 flex gap-6">
							<PrimaryTiny className="order-2" onClick={saveUsername} disabled={busy}>{t("common.save")}</PrimaryTiny>
							<SecondaryTiny className="order-1" onClick={() => closeAndReset("username")} disabled={busy}>{t("common.cancel")}</SecondaryTiny>
						</div>
					</div>
				)}

				{/* Password */}
				{openRow === "password" && (
					<div className="w-full max-w-md">
						<h2 
							className="mb-6 font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              				style={{ textShadow: `
                  				-3px 0 #000,
                  				3px 0 #000,
                  				0 3px #000,
                  				0 -3px #000,
                  				3px 3px #59322B,
                 				-3px -3px #59322B`
               				}}
						>
							{t("settings.item.password")}
						</h2>
						<label className="font-body text-medium text-white block mb-2">{t("settings.item.passwordCurrent")}</label>
						<input
							type="password"
							name="settings-current-password"
							autoComplete="off"
							readOnly
							onFocus={e => (e.currentTarget.readOnly = false)}
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							className="w-full maw-w-xs md-5 font-body placeholder-[#B088A3] bg-[#4A0A2E] text-[#FFFCC7] focus:ring-4 focus:ring-[#F472B6] focus-border-[#F0C4E0] rounded px-2 py-2 text-sm"
						/>
						<label className="font-body text-medium text-white block mt-3 mb-2">{t("settings.item.passwordNew")}</label>
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="w-full maw-w-xs md-5 font-body placeholder-[#B088A3] bg-[#4A0A2E] text-[#FFFCC7] focus:ring-4 focus:ring-[#F472B6] focus-border-[#F0C4E0] rounded px-2 py-2 text-sm"
						/>
						<label className="font-body text-medium text-white block mt-3 mb-2">{t("settings.item.passwordConfirm")}</label>
						<input
							type="password"
							value={confirmNewPassword}
							onChange={(e) => setConfirmNewPassword(e.target.value)}
							className="w-full maw-w-xs md-5 font-body placeholder-[#B088A3] bg-[#4A0A2E] text-[#FFFCC7] focus:ring-4 focus:ring-[#F472B6] focus-border-[#F0C4E0] rounded px-2 py-2 text-sm"
						/>
						{/* Inline error shown under the input */}
						{inlineErrors.password && (
							<p className="mt-5 font-body text-white text-sm mt-1">{inlineErrors.password}</p>
						)}
						<div className="mt-8 mb-3 flex gap-6">
							<PrimaryTiny className="order-2" onClick={savePassword} disabled={busy}>{t("common.save")}</PrimaryTiny>
							<SecondaryTiny className="order-1" onClick={() => closeAndReset("password")} disabled={busy}>{t("common.cancel")}</SecondaryTiny>
						</div>
					</div>
				)}

				{/* Avatar*/}
				{openRow === "avatar" && (
					<div className="w-full max-w-md">
						<h2 
							className="mb-6 font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              				style={{ textShadow: `
                  				-3px 0 #000,
                  				3px 0 #000,
                  				0 3px #000,
                  				0 -3px #000,
                  				3px 3px #59322B,
                 				-3px -3px #59322B`
               				}}
						>
							{t("settings.item.avatarSelect")}
						</h2>

						<div className="mb-5">
							<label className="mb-5 font-body text-white text-lg block">{t("settings.item.avatarCustomAvatar")}</label>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/png,image/jpeg,image/webp"
								onChange={onPickFile}
								className="w-full maw-w-xs md-5 font-body placeholder-[#B088A3] bg-[#4A0A2E] text-[#FFFCC7] focus:ring-4 focus:ring-[#F472B6] focus-border-[#F0C4E0] rounded px-2 py-2 text-sm"
							/>

							<div className="mt-5 w-full max-w-md flex flex-wrap items-center gap-4 rounded-xl border border-[#F0C4E0] bg-[#4A0A2E] px-4 py-3">
								{previewSrc ? ( 
									<div className="w-16 h-16 rounded-full bg-[#4A0A2E] overflow-hidden flex items-center justify-center border border-[#F0C4E0]">
									<img
										src={previewSrc}
										alt="Preview"
										className="w-16 h-16 rounded-full object-cover"
										onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
									/>
								</div>
								) : (
									<div className="w-16 h-16 rounded-full bg-[#4A0A2E] border border-[#F0C4E0]" />
								)}

								<div className="pl-4 mt-3 mb-3 flex flex-wrap gap-6">
									<PrimaryTiny
										className="order-2"
										onClick={uploadAvatarFile}
										disabled={!uploadFile || uploadBusy}
									>
										{t("common.upload")}
									</PrimaryTiny>
									<SecondaryTiny
										className="order-1"
										onClick={clearPickedFile}
										disabled={uploadBusy}
									>
										{t("common.clear")}
									</SecondaryTiny>
								</div>
							</div>

							<p className="font-body mt-3 text-sm text-white">{t("settings.item.avatarUploadHint")}</p>
						</div>

						{/* Built-in avatar */}
						<p className="font-body text-white text-lg mb-5">{t("settings.item.avatarBuiltIn")}</p>
						<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
							{availableAvatars.map((av) => (
								<button
									key={av}
									type="button"
									onClick={() => { setSelectedAvatar(av); setAvatarDirty(av !== currentAvatar); }}
									className={
										"rounded-xl p-1 border flex items-center justify-center transition-transform duration-150 " +
										(selectedAvatar === av 
											? "bg-[#4A0A2E] border-[#F0C4E0] scale-[1.03]"
											: "bg-[#4A0A2E] border-[#59322B] hover:border-[#F0C4E0] hover-translate-y-[1px]")
									}
									aria-label="Select avatar"
								>
									<img
										src={av}
										alt="Avatar choice"
										className="w-16 h-16 rounded-full"
									/>
								</button>
							))}
						</div>
						<div className="mt-8 mb-3 flex flex-wrap gap-6">
							<PrimaryTiny className="order-2" onClick={saveAvatar} disabled={busy || uploadBusy}>{t("common.save")}</PrimaryTiny>
							<SecondaryTiny
								className="order-1" onClick={onCancelAvatarClick} disabled={busy || uploadBusy}>{t("common.cancel")}</SecondaryTiny>
						</div>
					</div>
				)}

				{/* 2FA */}
				{openRow === "twofa" && (
					<div className="w-full">
						<h2 
							className="mb-6 font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              				style={{ textShadow: `
                  				-3px 0 #000,
                  				3px 0 #000,
                  				0 3px #000,
                  				0 -3px #000,
                  				3px 3px #59322B,
                 				-3px -3px #59322B`
               				}}
						>
							{t("settings.twofaLabel")}
						</h2>

						<label className="flex items-center gap-2 mb-4">
							<input
								type="checkbox"
								checked={twoFactor}
								onChange={handle2faCheckboxChange}
								disabled={!!qrCode}
							/>
							<span className="font-hand text-white text-lg">{t("settings.twofaLabel")}</span>
						</label>
						{showDisableConfirm && (
							<div className="mt-3 p-4 rounded-lg border border-[#59322B] bg-gray-900/30">
								<h3 className="font-body text-white text-lg">{t("settings.twofaDisableConfirmTitle")}</h3>
								<p className="font-body text-sm mt-4 text-white">
									{t("settings.twofaDisableConfirmText")}
								</p>
								<div className="mt-8 mb-3 flex flex-wrap gap-6">
									<PrimaryTiny onClick={confirmDisable2fa} disabled={busy}>
										{t("common.disable")}
									</PrimaryTiny>
									<SecondaryTiny onClick={cancelDisableConfirm} disabled={busy}>
										{t("common.cancel")}
									</SecondaryTiny>
								</div>
							</div>
						)}
						{qrCode && (
							<div className="mt-4 p-4 border border-[#59322B] rounded-lg bg-gray-900/30 text-white">
								<h3 className="font-body text-lg text-white">{t("settings.twofaEnableTitle")}</h3>
								<p className="text-sm mt-1 font-body text-white">{t("settings.twofaScanQR")}</p>
								<img
									src={qrCode}
									alt="2FA QR Code"
									className="my-3 mx-auto bg-white p-1 rounded"
								/>
								<p className="text-sm font-body text-white">{t("settings.twofaEnterCode")}</p>
								<div className="flex flex-wrap items-center gap-2 mt-2">
									<input
										type="text"
										className="maw-w-xs md-5 font-body placeholder-[#B088A3] bg-[#4A0A2E] text-[#FFFCC7] focus:ring-4 focus:ring-[#F472B6] focus-border-[#F0C4E0] rounded px-2 py-2 text-sm"
										placeholder="123456"
										value={otp}
										onChange={(e) => setOtp(e.target.value.replace(/\D/g,''))}
										maxLength={6}
									/>
									<div className="pl-5 mt-8 mb-3 flex flex-wrap gap-6">
									<PrimaryTiny onClick={handleVerify2fa} disabled={busy}>
										{t("common.verifyEnable")}
									</PrimaryTiny>
									<SecondaryTiny onClick={cancel2faSetup} disabled={busy}>
										{t("settings.twofaCancelSetup")}
									</SecondaryTiny>
									</div>
								</div>
							</div>
						)}
						{!qrCode && !showDisableConfirm && (
							<div className="mt-8 mb-3 flex flex-wrap gap-6">
								<SecondaryTiny onClick={() => closeAndReset("twofa")} disabled={busy}>
									{t("common.cancel")}
								</SecondaryTiny>
							</div>
						)}
					</div>
				)}

			{/* Delete */}
			{openRow === "delete" && (
				<div className="w-full">
						<h2 
							className="mb-6 font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
              				style={{ textShadow: `
                  				-3px 0 #000,
                  				3px 0 #000,
                  				0 3px #000,
                  				0 -3px #000,
                  				3px 3px #59322B,
                 				-3px -3px #59322B`
               				}}
						>
							{t("settings.title.delete")}
						</h2>

					{deleteError && (
						<p className="text-red-300 text-sm mb-2">
							{deleteError}
						</p>
					)}
					{deleted && (
						<p className="text-red-300 text-sm mb-2">
							{t("common.delete.success")}
						</p>
					)}

				{/* Delete confirmation logic */}
				{confirmDelete ? (
					<div className="mt-3 p-4 rounded-lg border border-[#59322B] bg-gray-900/30">
					<p className="text-lg text-white font-body text-red-200 mb-3">
						{t("settings.delete.text")}
					</p>
					<div className="mt-8 mb-3 flex flex-wrap  gap-6">
						<SecondaryTiny
							className="order-2"
							onClick={handleDeleteProfile}
							disabled={deleting || deleted}
						>
							{deleting ? t("common.deleting") : t("game.action.confirm")}
						</SecondaryTiny>
						<PrimaryTiny
							className="order-1"
							onClick={() => setConfirmDelete(false)}
						>
							{t("common.cancel")}
						</PrimaryTiny>
					</div>
				</div>
			) : (
				<div className="mt-8 mb-3 flex flex-wrap gap-6">
				<SecondaryTiny
					className="order-2"
					onClick={() => setConfirmDelete(true)}
					disabled={deleting || deleted}
				>
					{deleted ? t("common.deleted") : t("settings.item.delete")}
				</SecondaryTiny>
				<PrimaryTiny
					className="order-1"
					onClick={() => closeAndReset("delete")}
					disabled={deleting}
				>
					{t("common.cancel")}
				</PrimaryTiny>
				</div>
			)}
		</div>
		)}
		</div>
		)}
		</CenteredContainer>
		</ArcadeFrame>
	);
};

function PrimaryTiny({
	children,
	onClick,
	disabled,
	className = "",
}: TinyButtonProps) {
	return (
		<SketchyButton
			variant="shadow"
			bg="#58d1b7d9"
			hoverBg="#1ea58893"
			borderColor="#177863ff"
			onClick={!disabled ? onClick : undefined}
			className={
				"font-body px-4 py-1.5 text-sm rounded-lg font-semibold tracking-wide w-32 " +
				(disabled
					? "opacity-60 cursor-not-allowed"
					: "") +
				(className ? " " + className : "")
				}
		>
			{children}
		</SketchyButton>
	);
}

function SecondaryTiny({
	children,
	onClick,
	disabled,
	className = "",
}: TinyButtonProps) {
	return (
		<SketchyButton
			variant="shadow"
			bg="#a48d988a"
			hoverBg="#a91a5f8a"
			borderColor="#a91a5f8a"
			onClick={!disabled ? onClick : undefined}
			className={
				"font-body px-4 py-1.5 text-sm rounded-lg font-semibold  tracking-wide w-32 " +
				(disabled
					? "opcaity-60 cursor-not-allowed"
					: "") +
				(className ? " " + className : "")
				}
		>
			{children}
		</SketchyButton>
	);
}

export default SettingsPage;
