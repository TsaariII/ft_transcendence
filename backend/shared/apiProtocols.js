const path = require("path");


// Shared endpoint definitions for frontend & backend

const API_PROTOCOL = {
	REGISTER_USER: {
		path: '/api/register',
		method: 'POST',
	},
	LOGIN_USER: {
		path: '/api/login',	
		method: 'POST',
	},
		CREATE_GAME:  {
		path: '/api/create-game',
		method: 'POST',
	},
	START_GAME:  {
		path: '/api/start-game',
		method: 'POST',
	},
		JOIN_GAME:  {
		path: '/api/join-game',
		method: 'POST',
	},
	GET_USER: {
		path: '/api/user/:id',
		method: 'GET',
	},
	GET_PROFILE: {
		path: '/api/profile',
		method: 'GET',
	},

	GET_OTHER_PLAYER_PROFILE: {
		path: '/api/profile/other-user',
		method: 'GET',
	},

	LOGOUT_USER: {
		path: '/api/logout',
		method: 'POST',
	},
	// SettingsPage;

	DELETE_PROFILE: {
		path: '/api/profile',
		method: 'DELETE',
	},

	CHANGE_LANGUAGE: {
		path: '/api/profile/language',
		method: 'PATCH',
	},

	CHANGE_USERNAME: {
		path: '/api/profile/username',
		method: 'PATCH',
	},

	CHANGE_PASSWORD: {
		path: '/api/profile/password',
		method: 'PATCH',
	},

	CHANGE_AVATAR: {
		path: '/api/profile/avatar',
		method: 'PATCH',
	},

	ADD_FRIEND: {
		path: '/api/friends/add',
		method: 'POST',
	},

	CREATE_TOURNAMENT: {
		path:'/api/tournaments',
		method: 'POST',
	},

	GAME_STATE: {
		path:'/api/game/local/:id/state',
		method: 'GET',
	},

	GET_FRIENDS: {
		path: '/api/friends',
		method: 'GET',
	},

	GET_LEADERBOARD: {
		path: '/api/leaderboard',
		method: 'GET',
	},

	GET_PLAYER: {
		path: '/api/player',
		method: 'GET',
	},

	GET_TOURNAMENT_STATE: {
		path: '/api/tournament/state',
		method: 'GET',
	},

	START_TOURNAMENT: {
		path:'/api/tournament/:id/start',
		method: 'POST',
	},

	START_TOURNAMENT_MATCH: {
		path: '/api/tournament/start-match',
		method: 'POST',
	},

	TOURNAMENT_STATE: {
		path: '/api/tournament/:id/state',
		method: 'POST',
	},

	UPDATE_PROFILE: {
		path: '/api/profile/update',
		method: 'POST',
	},

	VERIFY_PLAYER: {
	path: '/api/tournament/verify-player',
	method: 'POST',
	},


	REPORT_GAME_RESULT:{
	path: '/api/games/result',
	method: 'POST' },
	CHANGE_2FA: {
	path: '/api/profile/2fa',
	method: 'POST',
	},

	REMOVE_FRIEND: {
	path: '/api/friends/remove',
	method: 'POST'
	},

	UPLOAD_AVATAR: {
	path: '/api/profile/avatar',
	method: 'POST',
	},

	CANCEL_TOURNAMENT: {
		path: '/api/tournament/cancel',
		method: 'DELETE',
	},

	GET_ACTIVE_TOURNAMENT: {
		path: '/api/tournament/get-active',
		method: 'GET',
	},

	REMOVE_PLAYER_FROM_TOURNAMENT: {
		path: '/api/tournament/remove-player',
		method: 'POST',
	},

	UPDATE_2FA: {
		path: '/api/profile/update2FA',
		method: 'POST',
	},

  TFA_SETUP: {
	path: '/api/2fa/setup',
    method: 'POST',
  },

  TFA_VERIFY: {
	path: '/api/2fa/verify',
	method: 'POST',
  },

  TFA_DISABLE: {
	path: '/api/2fa/disable',
    method: 'POST',
  },

  TFA_STATUS: {
	path: '/api/2fa/status',
    method: 'GET',
  },

  TFA_LOGIN_VERIFY: {
	path: '/api/2fa/login-verify',
	method: 'POST',
  }

};


module.exports = { API_PROTOCOL };

//  GET_GAME_STATE: {
//    path: '/api/game/state',
//    method: 'GET',
//  },npm install @sinclair/typebox
