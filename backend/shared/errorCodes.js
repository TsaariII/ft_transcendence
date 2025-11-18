/**
 * Centralised error messages and HTTP codes for the API layer.
 *
 * Usage examples:
 *
 *   const { ERROR_CODES } = require('@sharedErr');
 *
 *   // Auth failures (token / login issues)
 *   const err = ERROR_CODES.UNAUTHORIZED('MISSING_TOKEN');
 *   reply.code(err.code).send({ error: err.message });
 *
 *   // Validation failures (used by errorFormatter)
 *   const err = ERROR_CODES.VALIDATION_FAILED();
 *   reply.code(err.code).send({ error: err.message });
 */


// Messages specifically for authentication/token problems
const AUTH_ERROR_MSG = {
	DEFAULT_AUTH: 'Authentication required',
	INVALID_TOKEN: 'Invalid Token',
	MISSING_TOKEN: 'Missing Token',
	TOKEN_EXPIRED: 'Token expired , refresh',
	USER_NOT_VERIFIED: 'User account is not verified',
}

// Generic, non-auth error messages (optional, used as defaults)
const ERROR_MESSAGES = {
	INVALID_USERNAME: 'Username does not exist',
	INVALID_PASSWORD: 'Incorrect password',
	INVALID_INPUT: 'Input format is incorrect',
	DEFAULT_VALIDATION: 'Invalid input',

};

const ERROR_CODES = {
  /**
    * Generic validation failure (HTTP 400).
    * The exact human-readable message is usually decided in errorFormatter.js,
    * but this provides the canonical status code and a safe default.
    */
  VALIDATION_FAILED: () =>({
    code: 400,
    message: ERROR_MESSAGES.DEFAULT_VALIDATION
  }),
    /**
   * Auth / token failure (HTTP 401).
   * msgKey should be one of AUTH_ERROR_MSG keys:
   *   'DEFAULT_AUTH' | 'INVALID_TOKEN' | 'MISSING_TOKEN' | 'TOKEN_EXPIRED' | 'USER_NOT_VERIFIED'
   */
  UNAUTHORIZED: (msgKey = 'DEFAULT_AUTH') =>({
    code: 401,
    message: AUTH_ERROR_MSG[msgKey] || AUTH_ERROR_MSG.DEFAULT_AUTH
  }),

  FORBIDDEN: {
    code: 403,
    message: 'Access denied'
  },
  NOT_FOUND: {
    code: 404,
    message: 'Resource not found'
  },
  CONFLICT: {
    code: 409,
    message: 'Conflict detected'
  },
  SERVER_ERROR: {
    code: 500,
    message: 'Unexpected server error'
  }
};

module.exports = {ERROR_CODES, ERROR_MESSAGES, AUTH_ERROR_MSG};