// Shared TypeScript payload and response shapes

// Auth

// for new users
export interface RegisterUserPayload {
  username: string;
  password: string;
}

export interface RegisterUserResponse {
  status: 'REGISTERED' | 'ERROR';
  user_id?: string;   // if registration is successful
  jwt?: string;       // automatic login after successful registration
  error?: string;     // only in case of error
}


//for existing users
export interface LoginUserPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: 'AUTHENTICATED' | '2FA_REQUIRED | ERROR';
  jwt?: string;   // if authenticated successfully
  method?: 'TOTP' | 'EMAIL';   // only if 2FA is required (depends on selected method: authenticator vs email)
  error?: string;  // only in case of error 
}


// if 2FA is enabled in user profile
export interface TwoFactorPayload {
  username: string;
  code: string;
}

export interface TwoFactorResponse {
  status: 'AUTHENTICATED' | 'ERROR';
  jwt?: string;  // upon successful 2FA authentication 
  error?: string; // only in case of error
}


// User profile

export interface UserProfile {
  user_id: string;
  username: string;
  avatarFile?: string;
  twoFactor: boolean;
  rank: number;
  score: number;
  victories: number;
  losses: number;
  totalMatches: number;
  tournamentWins?: number;
  friends: Friend[];
  matchHistory: Match[];
  tournament: TournamentState;
  language?: "en" | "fi" | "sv";
  //online_status: boolean;
}

export interface OtherUserProfilePayload {
  user_id: string;
}

export interface OtherUserProfileResponse {
    username: string;
    avatarFile?: string;
    rank: number;
    score: number;
    victories: number;
    losses: number;
    totalMatches: number;
    tournamentWins?: number;
    matchHistory: Match[];
}
  
// is user enables/disables 2FA or changes avatar image on profile page, USERNAME CHANGE???

export interface UpdateProfilePayload {
  avatar?: string;
  twoFactor?: boolean;
}

export interface UpdateTwoFactorAuthPayload {
  twoFactor?: boolean;
}

export interface UpdateTwoFactorAuthResponse {
  status: 'UPDATED' | 'ERROR';
  error?: string;
}

export interface UpdateProfileResponse {
  status: 'UPDATED' | 'ERROR';
  profile?: UserProfile;
  error?: string;
} 

// Friends

export interface Friend {
  user_id: string;
  username: string;
  avatar?: string;
  online_status: boolean;
}

export interface FriendRequestPayload {
  friend_id: string;  // user_id of the user being added as friend
}

export interface FriendRequestResponse {
  status: 'ADDED' | 'REMOVED' | 'ERROR';
  friend?: Friend;
  error?: string;
}


// Matches

export interface Match {
  user_id: string;
  opponent: string;
  result: 'win' | 'loss';
  score: number;
  timestamp: string;
}

export interface Player {
  user_id: string;
  username: string;
  avatar: string;
  score: number;
  rank: number;
  //online_status: boolean;
}

export interface LeaderboardEntry {
  username: string;
  avatar: string;
  score: number;
  rank: number;
  online_status: boolean;
}

export type PlayerPayload = Player[];

export interface MatchHistoryResponse {
  matches: Match[];
}


// Game creation

export interface CreateGamePayload {
  player1: string;
  player2: string;
}

export interface CreateGameResponse {
  game_id: string;                           // unique ID for the game session
  player1: { alias: string };
  player2: { alias: string };
  paddle1: PaddleState;                      // initial position of player1 paddle
  paddle2: PaddleState;                      // initial position of player2 paddle
  ball: BallState;                           // initial ball position and speed
  scorePlayer1: number;                            // initial score of player1
  scorePlayer2: number;                            // initial score of player1
  status: 'WAITING' |'PLAYING' | 'FINISHED'; // game status
}


// Game state

export interface PaddleState {
  x: number;
  y: number;
}

export interface BallState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}


// Player controls

export interface PaddleMovementPayload {
  game_id: string;                 // game ID
  side: 'LEFT' | 'RIGHT';          // which paddle moves
  action: 'UP' | 'DOWN' | 'STOP';
}

export interface PaddleMovementResponse {
  status: 'OK' | 'ERROR';
  error?: string; 
}


// Game state updates


export interface GameFinished {
  game_id: string;
  winner: 'PLAYER1' | 'PLAYER2';
  finalScorePlayer1: number;
  finalScorePlayer2: number;
}

// Tournament

export interface CreateTournamentPayload {
  max_players?: number;
}

export interface CreateTournamentResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  tournament: TournamentState;
}

export interface GetActiveTournamentPayload {
}

export interface GetActiveTournamentResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  tournament: TournamentState;
}

export interface TournamentResetPayload {
	tournamentID: string;
}

// type used in frontend

/*export interface TournamentState {
  tournament_id: string;
  status: 'waiting' | 'ongoing' | 'finished';
  owner: string;
  players: TournamentPlayer[];
  currentMatch?: Match;
  bracket?: Match[][];
  winner?: TournamentPlayer;
  createdAt?: Date;
  lastUpdated?: Date
  can_start?: boolean;
  pending_players?: number;
} */

export interface VerifyPlayerPayload {
  role: string;
  username: string;
  password: string;
  alias: string;
  tournament_id: string;
}

export interface VerifyPlayerResponse {
  tournament: TournamentState;
  status: 'OK' | 'ERROR';
  error?: string;
}

export interface RemovePlayerPayload {
  tournament_id: string;
  role: string;
}

export interface RemovePlayerResponse {
  tournament: TournamentState;
  status: 'OK' | 'ERROR';
  error?: string;
}

export interface StartTournamentPayload {
  tournament_id: string;
}

export interface StartTournamentResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  tournament: TournamentState;
}

export interface StartTournamentMatchPayload {
  match_id: string;
}

export interface StartTournamentMatchResponse {
  status: "OK" | "ERROR";
  error?: string;
  tournament: TournamentState;
}

export interface MatchResultPayload {
  tournament_id: string;
  match_id: string;
  winner_id: string;              // user_id of winner
  score: {
    player1: number;
    player2: number;
  };
}

// Should these go over API endpoint or websocket??

export interface MatchInfo {
  game_id: string;
  player1: string;
  player2: string;
}

export interface MatchResultPayload {
  tournament_id: string;
  game_id: string;
  winner: string;
  scorePlayer1: number;
  scorePlayer2: number;
}

export interface MatchResultResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  updated_tournament?: TournamentState;
}

// Settings

export interface ChangeLanguagePayload {
	language: string;
}

export interface ChangeLanguageResponse {
	status: 'UPDATED' | 'ERROR';
	error?: string;
}

export interface ChangeUsernamePayload {
	username: string;
}

export interface ChangeUsernameResponse {
	status: 'UPDATED' | 'ERROR';
	profile?: UserProfile; //Returning updated profile
	error?: string;
}

export interface ChangePasswordPayload {
	current_password: string;
	new_password: string;
}

export interface ChangePasswordResponse {
	status: 'UPDATED' | 'ERROR';
	error?: string;
}

export interface ChangeTwoFactorPayload {
	twoFactor: boolean;
}

export interface ChangeTwoFactorResponse {
	status: 'UPDATED' | 'ERROR';
	twoFactor?: boolean;
	error?: string;
}

export interface UploadAvatarResponse {
	status: 'UPLOADED' | 'ERROR';
	url?: string;
	error?: string;
}

export interface LeaderBoardResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  leaders: LeaderboardEntry[],
}

// over websocket??

export interface TournamentFinished {
  tournament_id: string;
  winner: string;
  final_results: Results[];
}

export interface FinishedMatch {
  game_id: string;
  player1: string;
  player2: string;
  winner: string;
  scorePlayer1: number;
  scorePlayer2: number;
}

/*
export interface Results {
  alias: string;
  position: number;
} 
  */

