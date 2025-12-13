# Creating a new tournament

## Basic types used to store data related to a tournament

```
export interface TournamentState {
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
}
```
```
export interface TournamentPlayer {
  username: string;
  alias: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  avatar?: string;
  score: number;
  isSelf?: boolean;
  isVerified?: boolean;
}
```
```
export interface Match {
  match_id: string;
  player1: TournamentPlayer;
  player2: TournamentPlayer;
  winner?: TournamentPlayer;
  score?: {
    player1: number;
    player2: number;
  };
  status: 'pending' | 'ongoing' | 'finished';
  //lastUpdated: Date;
  //gameState?: any;
}
```

## Tournament logic 

1. Tournament (lobby) page is the main entry point for the tournament and manages the other components
  * When "Start a new tournament" is clicked
    - Frontend sends ```CreateTournamentPayload``` to ```CREATE_TOURNAMENT``` API path
    - Backend generates a tournament_id and adds logged in user to the players array in ```CreateTournamentResponse``` and returns it to frontend
2. Frontend shows input fields for all 4 players, player1 is logged in player
3. For player1, user must enter alias and click 'Save Alias'
	-> Frontend validates alias input based on REGEX and uniqueness rules
	-> backend call ```VerifyPlayerPayload``` to ```VERIFY_PLAYER````
4. For player1, clicking Edit alias must send a new verify call to backend to update the alias
5. Backend returns ```VerifyPlayerResponse``
6. For other players, user must fill in username, password and alias fields and then click "Add Player" button
	-> Frontend validates alias input based on REGEX rules
	-> backend call ```VerifyPlayerPayload``` to ```VERIFY_PLAYER```` and the player  is added to the tournament at the backend
	-> Backend returns ```VerifyPlayerResponse``
7. If user removes a player from the tournament 
	-> Frontend sends ```RemovePlayerPayload``` to backend and player is removed from the tournament at the backend
	-> frontend clears input fields for that role
8. When all players have been added and verified, frontend enables "Start tournament" button
9. Clicking 'Cancel tournament' button, sends DELETE call to ```CANCEL_TOURNAMENT``` endpoint and backend wipes out tournament from database
10. When "Start tournament" button is clicked
  * TournamentSetup page: Frontend sends ```StartTournamentPayload``` request to ```START_TOURNAMENT```
  * Backend responds with ```StartTournamentResponse``` which includes match IDs for all matches and players for round1 matches
11. TournamentBracket component: Frontend renders a tournament bracket based on ```StartTournamentResponse```
  * First round matches are known, others are TBD
  * Buttons for playing all three matches (enabled for first match)
12. TournamentLobby page: When "Play Match" button is clicked
  * Frontend sends ```StartTournamentMatchPayload``` to ```START_TOURNAMENT_MATCH```
  * Backend responds with ```StartTournamentMatchResponse```
13. Game is rendered in an iframe
14. Game index.html sends info about winner to parent and bracket is updated accordingly


## Files related to tournament

### TournamentLobby.tsx
 
The main controller for the tournament flow

 Responsibilities:
 - Displays the main layout for the tournament page
 - Manages tournament state (create → setup → bracket → active match)
 - Creates a new tournament through backend API
 - Handles setup phase (adding and verifying players)
 - Switches to the bracket view once setup is complete
 - Starts individual matches and displays the Pong game in an iframe
 - Cleans up active match state when a match ends
 
 State Flow:
 - `tournament = null`: No tournament yet → show "Start new tournament" button
 - `tournament && showSetup = true`: Tournament created → show setup (player search & list)
 - `tournament && !showSetup`: Tournament ready/ongoing → show tournament bracket
 - `currentGameMatch && activeGameId`: A match is active → show Pong iframe

### TournamentSetup.tsx

Manages the setup phase of a tournament

 Responsibilities:
  - Asks the user to add 3 players (the logged in player is always included)
  - Requires verification from backend
  - Gives an option to remove players
  - Ensures the setup is valid before allowing the tournament to start
  - When "Start tournament" is clicked, sends the tournament id to backend,
    builds the initial bracket structure, and notifies the parent via `onTournamentUpdated`

 ### PlayerList.tsx

Component that manages the list of players added to the tournament

 Responsibilities:
  - Displays all players added to the tournament
  - Lets the logged-in user see their username but not edit/remove it
  - Lets other players:
    - Enter a password (for verification)
    - Enter a unique alias (must be at least 5 characters)
    - Validates inputs and reports back to parent via `onValidationChange`
    - Supports removing players (except logged in player)

 State Flow:
  - `errors`: per-player error messages (password or alias issues)
  - `onUpdatePlayer`: parent callback to update player fields
  - `onValidationChange`: tells parent whether all players are valid


 ### TournamentBracket.tsx

 Component that visually renders a simple tournament bracket

 Structure:
  - 2 matches in the first round (4 players total)
  - 1 final match between the winners of round 1
  - Displays the eventual winner once the final has been played

 Responsibilities:
  - Shows each round of the tournament in a bracket-style layout with connecting lines
  - Displays players, current match statuses, and the winner when available
  - Allows matches to be started through `onStartMatch` callback

 Data Flow:
  - Input: `tournament` (state including players, matches, winners)
  - Output: Calls `onStartMatch(match)` when a user clicks to play a match

 Helpers:
  - `isMatchPlayable`: ensures matches can only be started when both players are ready

Sequence:
  1. Once all players are validated  → parent builds `tournament` state
  2. Bracket renders players in matches → waits for `winner` updates
  3. User clicks "Play Match" → calls `onStartMatch` → parent updates match results
  4. Winners propagate until final → bracket shows tournament winner