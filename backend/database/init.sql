PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users
(
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar_file TEXT,
	language TEXT NOT NULL DEFAULT 'en',
    status TEXT NOT NULL DEFAULT 'offline',
    mfa_enabled INTEGER NOT NULL DEFAULT 0,
	mfa_secret TEXT,
    rank INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    total_games INTEGER NOT NULL DEFAULT 0
);

-- multidirectional friendship table, allows for sigle directional requests
-- status can be 'pending', 'accepted', 'blocked'
-- cap at 20?
CREATE TABLE IF NOT EXISTS friends (
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending',
    CHECK (user_id <> friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, friend_id) -- ensures no duplicate friendships
);
-- CREATE INDEX IF NOT EXISTS idx_friend_friend_id ON friends(friend_id);

-- tournament table
CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting','ongoing','finished', 'closed')),
    winner_id TEXT,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- do we want to add if game was 1v1 or tournament ?
-- no match key as we want to use this to build leaderboard
-- leaderboard should not have same player twice , if user has top score , next score is another user
CREATE TABLE IF NOT EXISTS games
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    p1_id TEXT,
    p2_id TEXT,
    p1_score INTEGER NOT NULL DEFAULT 0,
    p2_score INTEGER NOT NULL DEFAULT 0,
    type TEXT,
    mode TEXT,
    winner_id TEXT,
    round INTEGER,
    bracket_pos INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'ongoing', 'finished')),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (p1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (p2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TRIGGER IF NOT EXISTS trg_games_after_delete_adjust_user_stats
AFTER DELETE ON games
BEGIN
    -- Player 1
    UPDATE users
    SET
        wins        = wins
                      - CASE
                            WHEN OLD.status = 'finished'
                             AND OLD.winner_id = OLD.p1_id
                            THEN 1 ELSE 0
                        END,
        losses      = losses
                      - CASE
                            WHEN OLD.status = 'finished'
                             AND OLD.winner_id = OLD.p2_id
                            THEN 1 ELSE 0
                        END,
        total_games = total_games
                      - CASE
                            WHEN OLD.status = 'finished'
                             AND OLD.p1_id IS NOT NULL
                            THEN 1 ELSE 0
                        END
    WHERE id = OLD.p1_id;

    -- Player 2
    UPDATE users
    SET
        wins        = wins
                      - CASE
                            WHEN OLD.status = 'finished'
                             AND OLD.winner_id = OLD.p2_id
                            THEN 1 ELSE 0
                        END,
        losses      = losses
                      - CASE
                            WHEN OLD.status = 'finished'
                             AND OLD.winner_id = OLD.p1_id
                            THEN 1 ELSE 0
                        END,
        total_games = total_games
                      - CASE
                            WHEN OLD.status = 'finished'
                             AND OLD.p2_id IS NOT NULL
                            THEN 1 ELSE 0
                        END
    WHERE id = OLD.p2_id;

    -- Recompute score for both players (10 for win, 5 for loss)
    UPDATE users
    SET score = wins * 10 + losses * 5
    WHERE id IN (OLD.p1_id, OLD.p2_id);
END;

CREATE TABLE IF NOT  EXISTS tournament_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    tournament_id INTEGER NOT NULL,
    alias TEXT NOT NULL,
    role INTEGER NOT NULL CHECK (role BETWEEN 1 AND 4),
    status TEXT NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting', 'ready', 'playing', 'finished')),
    verified INTEGER NOT NULL DEFAULT 0,
    UNIQUE (tournament_id, user_id),
    UNIQUE (tournament_id, alias),
    UNIQUE (tournament_id, role),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tp_tournament ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tp_user       ON tournament_players(user_id);