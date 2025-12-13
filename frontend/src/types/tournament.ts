export interface TournamentPlayer {
  username: string;
  alias: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  avatar?: string;
  score?: number;
  isSelf?: boolean;
  isVerified?: boolean;
  role: string;
}

export interface Match {
  match_id: string;
  player1: TournamentPlayer;
  player2: TournamentPlayer;
  winner?: "string";
  score?: {
    player1: number;
    player2: number;
  };
  status: 'pending' | 'ongoing' | 'finished';
}

export interface TournamentState {
  tournament_id: string;
  status: 'waiting' | 'ongoing' | 'finished';
  owner: string;
  players: TournamentPlayer[];
  currentMatch?: Match;
  bracket?: Match[][];
  winner?: "string";
  createdAt?: Date;
  lastUpdated?: Date
  can_start?: boolean;
  pending_players?: number;
}


type GameResultPayload = {
  gameId: string;
  winner: string;
  loser: string;
  score: [number, number];
};
