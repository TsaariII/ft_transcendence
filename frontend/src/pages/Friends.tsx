import React, { useEffect, useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import { useTranslation } from "../shared/Translation";
import defaultAvatar from "../assets/avatars/default-avatar.png";
import { useAuth } from "../context/AuthContext";
import PlayerProfileModal from "../components/profile/PlayerProfileModal";
import { useApiFetch } from "../utils/apiFetch"
import CenteredContainer from "../components/layout/CenteredContainer";
import { ArcadeFrame } from "../components/layout/ArcadeFrame";
import SketchyButton from "../components/ui/SketchyButtons";


type Friend = {
	user_id: string;
	username: string;
	avatar?: string | null;
	online_status: boolean;
};

type FriendRequestResponse = {
	status: "ADDED" | "REMOVED" | "ERROR";
	friend?: Friend;
	error?: string;
};

const MAX_FRIENDS = 20;

const Friends: React.FC = () => {
	const { t } = useTranslation();
	const {isLoggedIn, user, loading, refreshSession } = useAuth(); //now using AuthContext to get user info
	const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

	// Inline status
	const [msg, setMsg] = useState<string | null>(null);
	const [err, setErr] = useState<string | null>(null);

	// Expand/collapse
	const [openAdd, setOpenAdd] = useState(false);

	// Remove friend
	const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
	const [removing, setRemoving] = useState(false);

	// List friend (from Authontext)
	const [friends, setFriends] = useState<Friend[]>(user?.friends?.slice(0, MAX_FRIENDS) || []);// means we use the friends from AuthContext if available. Slice to limit to MAX_FRIENDS

	// Add friend
	const [username, setUsername] = useState("");
	const [busyAdd, setBusyAdd] = useState(false);

	// Clear forms
	function resetAddForm() {
		setUsername("");
	}

	// Open/close remove friend
	function toggleRemove(friendId: string) {
		setMsg(null);
		setErr(null);
		setRemoveConfirmId((cur) => (cur === friendId ? null : friendId));
	}
	// Use apiFetch hook
	const apiFetch = useApiFetch();


	if (loading) return <div className="p-6">{t("friends.loading")}</div>;
	if (!isLoggedIn) { //changed from !user to !isLoggedIn
	return (
		<div className="p-6 text-center text-gray-300">
		 {t("friends.loginRequired")}
		</div>
	);
	}

	useEffect(() => {
		if (user) {
			setFriends(user.friends?.slice(0, MAX_FRIENDS) || []);
		}
	}, [user]);

	async function handleAdd() {
		setErr(null);
		setMsg(null);
		setBusyAdd(true);
		
		try {
			const value = username.trim();
			if (!value) {
				setBusyAdd(false);
				return;
			}
			if (friends.length >= MAX_FRIENDS) {
				setErr(t("error.friends.maxNum"));
				setBusyAdd(false);
				return;
			}
			if (friends.some((f) => f.username.toLowerCase() === value.toLowerCase())) {
				setErr(t("error.friends.alreadyFriend"));
				setBusyAdd(false);
				return;
			}

			if (user?.username && value.toLowerCase() === user.username.toLowerCase()) {
				setErr(t("error.friends.cannotAddSelf"));
				setBusyAdd(false);
				return;
			}

			const data: FriendRequestResponse = await apiFetch(API_PROTOCOL.ADD_FRIEND.path, {
			method: API_PROTOCOL.ADD_FRIEND.method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username: value }),
			});

			if (data.status !== "ADDED" || !data.friend) {
			throw new Error(data.error); // no fallback text
			}

			//setFriends((prev) => [...prev, data.friend!].slice(0, MAX_FRIENDS));
			resetAddForm();
			setMsg(t("common.friends.added"));
			setOpenAdd(false);
			await refreshSession(); // Refresh user data in AuthContext to update friends list there too
		} catch (e: any) {
			if (e.sessionExpired) return; // let apiFetch redirect handle it
			setErr(t("error.friends.addFailed"));
		} finally {
			setBusyAdd(false);
		}
	}

	async function confirmRemove(friendId: string) {
		setRemoving(true);
		setErr(null);
		setMsg(null);
		try {
			
			const data: FriendRequestResponse = await apiFetch(API_PROTOCOL.REMOVE_FRIEND.path, {
			method: API_PROTOCOL.REMOVE_FRIEND.method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ friend_id: friendId }),
			});

			if (data.status !== "REMOVED") {
			throw new Error(data.error);
			}

			setFriends((prev) => prev.filter((f) => f.user_id !== friendId));
			setRemoveConfirmId(null);
			setMsg(t("common.friends.removed"));
			await refreshSession(); // Refresh user data in AuthContext to update friends list there too
		} catch (e: any) {
			if (e.sessionExpired) return; // redirect already triggered by apiFetch
			setErr(t("error.friends.removeFailed"));
		} finally {
			setRemoving(false);
		}
	}

	return (
		<ArcadeFrame title={t("friends.title")}>
			<CenteredContainer>
				{/* Inline status */}
				{msg && <p className="text-center text-font-body mb-3 text-green-300">{msg}</p>}
				{err && <p className="text-center font-body mb-3 text-red-300">{err}</p>}

					{/* Actions section */}
					<section className="w-full">
						{/* Add friend by username row */}
						<div className="max-w-2xl mx-auto">
						{!openAdd && (
							<div className="mt-4 mb-4 flex justify-center">
								<SketchyButton
									variant="shadow"
									bg="#58d1b7d9"
									hoverBg="#1ea58893"
									borderColor="#177863ff"
									onClick={() => setOpenAdd(true)}
								>
									{t("friends.add.title")}
								</SketchyButton>
							</div>
						)}
						{openAdd && (
							<div className="mt-2 mx-auto p-6 border-4 border-[#FFFCC7]"
								style={{
									width: "90%",
									borderRadius: "40px",
									boxShadow: "4px 6px 0 rgba(89,50,43,0.9)",
									transform: "rotate(-0.3deg)",
								}}
							>
								<label className="font-hand text-xl text-white block mt-3 mb-2">
										{t("friends.item.username")}
									</label>
									<input
										type="text"
										value={username}
										placeholder={t("auth.username")}
										onChange={(e) => setUsername(e.target.value)}
										className="w-full max-w-xs mb-5 font-body placeholder-[#b088a3] bg-[#4a0a2e] 
											text-[#fffcc7] focus:ring-4 focus:ring-[#f472b6] focus:border-[#f0c4e0] rounded px-2 py-2 text-sm"
									/>

									<div className="mt-3 flex flex-wrap gap-6">
										<SketchyButton
											variant="shadow"
											bg="#a48d988a"
											hoverBg="#a91a5f8a"
											borderColor="#a91a5f8a"
											className="w-32"
											onClick={() => { resetAddForm(); setOpenAdd(false); }}
											disabled={busyAdd}
										>
											{t("common.cancel")}
										</SketchyButton>
										<SketchyButton
											variant="shadow"
											bg="#58d1b7d9"
											hoverBg="#1ea58893"
											borderColor="#177863ff"
											className="w-32"
											onClick={handleAdd}
											disabled={busyAdd || !username.trim() || friends.length >= MAX_FRIENDS}
										>
											{t("common.add")}
										</SketchyButton>
									</div>
									{friends.length >= MAX_FRIENDS && (
										<p className="text-xs text-[#59322B] mt-2">
											{t("error.friends.maxNum")}
										</p>
									)}
								</div>
							)}
							</div>
						</section>

						{/* Friends list */}
						<section className="w-full mt-6">
							<div className="max-w-2xl mx-auto px-4">
								<h2 className="mb-4 font-cupcake text-[#FFFCC7] text-2xl tracking-wider"
									style={{ textShadow: `
										-3px 0 #000,
										3px 0 #000,
										0 3px #000,
										0 -3px #000,
										3px 3px #59322B,
										-3px -3px #59322B`
									}}
									>
									{t("friends.list.title")}
								</h2>

							<div className="p-5 md:p-6">

							{friends.length === 0 ? (
								<div className="font-body text-sm">{t("friends.list.empty")}</div>
							) : (
								<div className="space-y-3">
									{friends.map((f: Friend) => {
										const avatarSrc =
											f.avatar ??
											(f as any).avatarFile ??
											(f as any).avatar_file ??
											defaultAvatar;
										return (
										<div key={f.user_id} className="space-y-3">
											<div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl text-[#fffcc7] bg-[#5a0c37]/70 shadow-[2px_3px_0_#59322B]">
												<div className="flex items-center gap-3">
													<img
														src={avatarSrc}
														alt={`${f.username} avatar`}
														className="w-10 h-10 rounded-full border border-[#59322B]"
														onError={(e) => { 
															(e.currentTarget as HTMLImageElement).src = defaultAvatar;
														}}
													/>
													<div>
														{/* Username button opens the modal */}
														<button
															type="button"
															onClick={() => setSelectedPlayer(f.user_id)}
															className="font-body text-[#fffcc7] underline hover:no-underline"
														>
															{f.username}
														</button>
														<div className="flex items-center gap-1 text-sm font-body mt-1">
															<span
																className={
																	"inline-block w-2 h-2 rounded-full " +
																		(f.online_status ? "bg-[#58d1b7d9]" : "bg-[#a48d988a]")
																	}
																/>
															<span className={f.online_status ? "text-[#58d1b7d9]" : "text-[#a48d988a]"}>
																{f.online_status ? t("common.online") : t("common.offline")}
															</span>
														</div>
													</div>
												</div>

												<SketchyButton
													variant="shadow"
													bg="#a48d988a"
													hoverBg="#a91a5f8a"
													borderColor="#a91a5f8a"
													onClick={() => toggleRemove(f.user_id)}>
													{t("friends.item.remove")}
												</SketchyButton>
											</div>

											{/* Remove confirmation */}
											{removeConfirmId === f.user_id && (
												<div className="px-1 pb-1">
													<div className="rounded-xl border-2 border-[#fffcc7] p-4 shadow-[2px_3px_0_#59322B]">
														<h3 className="font-body text-[#FFFCC7] mb-2">
															{t("friends.confirmRemove.title")}
														</h3>
														<p className="text-sm font-body text-[#FFFCC7] mb-3">
															{t("friends.confirmRemove.text")}
														</p>
														<div className="flex flex-wrap gap-6">
															<SketchyButton
																variant="shadow"
																bg="#a48d988a"
																hoverBg="#a91a5f8a"
																borderColor="#a91a5f8a"
																onClick={() => setRemoveConfirmId(null)}
																disabled={removing}
																>
																{t("common.cancel")}
															</SketchyButton>
															<SketchyButton
																variant="shadow"
																bg="#58d1b7d9"
																hoverBg="#1ea58893"
																borderColor="#177863ff"
																onClick={() => confirmRemove(f.user_id)}
																disabled={removing}
																>
																{t("common.remove")}
															</SketchyButton>
														</div>
													</div>
												</div>
											)}
										</div>
										);
									})}
								</div>
							)}
							</div>
							</div>
						</section>
						
						{selectedPlayer && (
							<PlayerProfileModal
								userId={selectedPlayer}
								onClose={() => setSelectedPlayer(null)}
							/>
						)}
					
			</CenteredContainer>
		</ArcadeFrame>	
	);
};

function SettingButton({
	label,
	onClick,
}: {
	label: string;
	onClick: () => void;
}) {
	return (
		<div className="px-4 py-3">
			<button
				type="button"
				onClick={onClick}
				className="w-full flex justify-between items-center px-4 py-3 font-hand text-[#59322B] text-base bg-[#49A394]"

			>
				<span>{label}</span>
				<span className="text-lg">1</span>
			</button>
		</div>
	);
}

function PrimaryTiny({
	children,
	onClick,
	disabled,
}: {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={
				"font-hand px-4 py-1.5 text-sm rounded-lg font-semibold  tracking-wide " +
				(disabled
					? "bg-[#F9B4A5] text-[#59322B] cursor-not-allowed" 
					: "bg-[#FFFCC7] text-[#59322B] shadow-[3px_4px_0_#59322B] hover:translate-y-[1px] hover:shadow-[2px_3px_0_#59322B]")
			}
		>
			{children}
		</button>
	);
}

function SecondaryTiny({
	children,
	onClick,
	disabled,
}: {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={
				"font-hand px-4 py-1.5 text-sm rounded-lg font-semibold  tracking-wide " +
				(disabled
					? "bg-[#C04D57] text-[#FFFCC7] opacity-60 cursor-not-allowed" 
					: "bg-[#C04D57] text-[#FFFCC7] shadow-[3px_4px_0_#59322B] hover:translate-y-[1px] hover:shadow-[2px_3px_0_#59322B]")
				}
		>
			{children}
		</button>
	);
}

export default Friends;
