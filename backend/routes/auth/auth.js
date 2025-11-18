const schemas = require('@schemas/signSchema');
const { API_PROTOCOL } = require('@sharedApi');
const {log} = require('@logger');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'auth' }); // scoped logger

const speakeasy = require('speakeasy'); // for creating 2FA secrets
const qrcode = require('qrcode');      // creating qrcodes
const tempSetupSecrets = new Map();

/**
 * @type {import('../../shared/payloads').RegisterUserPayload}
 */


console.log('API_PROTOCOL:', API_PROTOCOL);

/**
 * 
defaults 
 */
async function registerUser(fastify, options) {
	const {secure, DBinsert,} = options;
	fastify.post(API_PROTOCOL.REGISTER_USER.path, {
	schema: { body: schemas.RegisterUser }
	}, async (request, reply) => {
		const { username, password} = request.body;
        try
        {
            const userId = await DBinsert.insertUser({username, password, score: 0, status: 'online'});
            const token = secure.generateToken(userId, username);
            secure.setAuthCookie(reply, token);
            reply.code(200).send('ok');
        }
        catch (err) { reply.code(err?.status || 500).send(err);}
	});
}

async function loginUser(fastify, options) {
    const { DBget, secure } = options;
    fastify.route({
        method: API_PROTOCOL.LOGIN_USER.method,
        url: API_PROTOCOL.LOGIN_USER.path,
        handler: async (request, reply) => {
            const { username, password } = request.body;
            try
            {
                const result = await DBget.miniLogin(username, password);
                const is2FaEnabled = await DBget.is2FaEnabled(result.id);
                if (is2FaEnabled)
                {
                    const tempToken = secure.generateTemporaryToken({id: result.id, type: '2fa_pending'});
                    return reply.code(202).send({message: '2FA required', tempAuthToken: tempToken});
                }
                const token = secure.generateToken(result.id, username);
                secure.setAuthCookie(reply, token);
                reply.code(200).send('ok');
            }
            catch (err) { reply.code(401).send({error: 'Invalid username or password'}); }
        }
    });
}

async function logoutUser(fastify, options) {
	const { secure, DBupdate } = options;
	fastify.post(API_PROTOCOL.LOGOUT_USER.path, {
	}, async (request, reply) => {
		const userId = request.userId; 
		try {
			secure.clearAuthCookie(reply);
			const err = await DBupdate.updateOnlineStatus(userId, false);
			if (err.error){
				reply.code(err.code).send( {message: err.error});
			}
			
			reply.code(200).send('ok');
		} catch (err) {
			console.log(('Error during login:', err));
			reply.code(418).send(err);
		}
	});
}


async function deleteUser(fastify, option) {
	const {secure, DBdelete, DBget} = option;
	fastify.route({
		method: API_PROTOCOL.DELETE_PROFILE.method,
		url: API_PROTOCOL.DELETE_PROFILE.path,
		handler: async (request, reply) => {
		console.log("DELETE USER ");
		console.log('request.userId:', request.userId);
		try	{
			const userId = request.userId;
			let oldAvatarUrl = null;
			try {
					const user = await DBget?.fetchUser?.(userId);
					oldAvatarUrl = user?.avatar_file || null;
				} catch (err) {
					console.warn("⚠️ Could not fetch user before delete:", err.message);
				}
		
			const result = await DBdelete.deleteUserById(userId);
			if (result === 1) {
				try {
						if (oldAvatarUrl && typeof oldAvatarUrl === 'string' && oldAvatarUrl.startsWith('/api/avatars/')) {
							await deleteOldAvatar(oldAvatarUrl);
						}
					} catch (err) {
						console.warn("⚠️ Failed to delete old avatar:", err.message);
					}
				reply.code(200).send("ok");//?
			}
			if (result === 0) {
				reply.code(400).send("user not found");
			}
			console.log("result of delete user", result);
		}
		catch {
			flog.error({fucntion: 'deleteUser'}, 'ERROR deleting user ');
			reply.code(418).send('error deleting user');
		}
		}
	});

}
/**
 * this nees refactoring so it uses all the api protocol calls 
 * @param {} fastify 
 * @param {*} options 
 */
/* Generates 2FA secret and QR code, stores secret temporarily in memory */
async function setupTwoFactor(fastify, options) {
    const { secure, DBget, DBupdate} = options;
    fastify.post(API_PROTOCOL.TFA_SETUP.path, {}, async (request, reply) => {
        flog.info({ function: 'setupTwoFactor' }, 'Starting 2FA setup process.');
        try {
			const userId = request.userId;
            if (!userId) {
                throw new Error("Invalid user token (request.userId is missing).");
            }

			const isEnabled = await DBget.is2FaEnabled(userId);
            if (isEnabled) {
                flog.warn({ function: 'setupTwoFactor', userId: userId }, 'User tried setup but 2FA is already enabled.');
                return reply.code(400).send({ error: '2FA is already enabled. Please disable it first to set up a new one.' });
            }

            const secret = speakeasy.generateSecret({
                name: `Ft_Transcendence`
            });

			const encryptedSecret = encrypt(secret.base32);
			await DBupdate.update2fa(false, userId, encryptedSecret);

            flog.info({ function: 'setupTwoFactor', userId: userId}, `Generated temporary secret for user.`);

            const data_url = await qrcode.toDataURL(secret.otpauth_url);
            reply.code(200).send({ qrCodeUrl: data_url });

        } catch (err) {
            flog.error({ function: 'setupTwoFactor', error: { message: err.message, stack: err.stack } }, 'An error occurred during 2FA setup.'); // Improved error logging
            reply.code(418).send({ error: 'An error occurred during 2FA setup.' });
        }
    });
}

/* verifies first OTP, saves PLAIN TEXT secret atm to DB, enables 2FA flag */
async function verifyTwoFactor(fastify, options) {
    const { secure, DBupdate, DBget } = options;
    fastify.post(API_PROTOCOL.TFA_VERIFY.path, {}, async (request, reply) => {
        const { otp } = request.body;
        flog.info({ function: 'verifyTwoFactor' }, 'Attempting first OTP verification for setup.');
        try {
			const userId = request.userId;
            if (!userId) {
                throw new Error("Invalid user token (request.userId is missing).");
            }

			const isAlreadyEnabled = await DBget.is2FaEnabled(userId);
            if (isAlreadyEnabled) {
                return reply.code(400).send({ error: '2FA is already verified and enabled.' });
			}

			const encryptedSecret = await DBget.get2FaSecret(userId);
            if (!encryptedSecret) {
                flog.warn({ function: 'verifyTwoFactor', userId: userId }, 'No temporary secret found in DB for user.');
                return reply.code(400).send({ error: 'No 2FA setup process started. Please try again.' });
            }

            const plainTextSecret = decrypt(encryptedSecret);
            const isVerified = speakeasy.totp.verify({
                secret: plainTextSecret,
                encoding: 'base32',
                token: otp
            });

            if (isVerified) {
                flog.info({ function: 'verifyTwoFactor', userId: userId }, `Successfully verified OTP. Enabling 2FA in DB.`);
				const encryptedSecret = encrypt(plainTextSecret);
                await DBupdate.update2fa(true, userId, encryptedSecret); // add to DB
                flog.debug({ function: 'verifyTwoFactor', userId: userId }, 'DB update attempted (plain text).');
                reply.code(200).send({ verified: true });
            } else {
                flog.warn({ function: 'verifyTwoFactor', userId: userId }, `Failed OTP verification during setup.`);
                reply.code(400).send({ verified: false, error: 'Invalid token.' });
            }
        } catch (err) {
            flog.error({ function: 'verifyTwoFactor', error: { message: err.message, stack: err.stack } }, 'An error occurred during 2FA verification.');
            reply.code(418).send({ error: 'An error occurred during 2FA verification.' });
        }
    });
}

/* Disables 2FA in the database */
async function disableTwoFactor(fastify, options) {
    const { secure, DBupdate } = options;
    fastify.post(API_PROTOCOL.TFA_DISABLE.path, {}, async (request, reply) => {
        flog.info({ function: 'disableTwoFactor' }, 'Attempting to disable 2FA.');
        try {
            const userId = request.userId;
			if (!userId) {
                throw new Error("Invalid user token (request.userId is missing).");
            }
            await DBupdate.update2fa(false, userId, null); // Pass null secret, false status

            flog.info({ function: 'disableTwoFactor', userId: userId }, '2FA disabled in DB for user.');
            reply.code(200).send({ disabled: true });
        } catch (err) {
            flog.error({ function: 'disableTwoFactor', error: { message: err.message, stack: err.stack } }, 'An error occurred while disabling 2FA.');
            reply.code(418).send({ error: 'An error occurred while disabling 2FA.' });
        }
    });
}

/* Checks the DB if 2FA is enabled for user */
async function getTwoFactorStatus(fastify, options) {
    const { secure, DBget } = options;
    fastify.get(API_PROTOCOL.TFA_STATUS.path, {}, async (request, reply) => {
        flog.debug({ function: 'getTwoFactorStatus' }, 'Fetching 2FA status for user');
        try {
            const userId = request.userId;
            const isEnabled = await DBget.is2FaEnabled(userId);

            flog.debug({ function: 'getTwoFactorStatus', userId: userId, isEnabled }, 'Returning 2FA status from DB.');
            reply.code(200).send({ isEnabled });

        } catch (err) {
            flog.error({ function: 'getTwoFactorStatus', error: { message: err.message, stack: err.stack } }, 'Error fetching 2FA status from DB:', err);
             reply.code(200).send({ isEnabled: false });
        }
    });
}

/* Verifies OTP during login using PLAIN TEXT secret from DATABASE */ //this to be ignored also in authook
async function verifyLoginTwoFactor(fastify, options) {
    const { secure, DBget } = options;
    fastify.post(API_PROTOCOL.TFA_LOGIN_VERIFY.path, {}, async (request, reply) => {
        const { otp, tempAuthToken } = request.body;
        flog.info({ function: 'verifyLoginTwoFactor' }, 'Attempting 2FA login verification.');
        try {
            const decodedTempToken = secure.verifyTemporaryToken(tempAuthToken);
            if (!decodedTempToken || decodedTempToken.type !== '2fa_pending' || decodedTempToken.id === undefined) {
                return reply.code(401).send({ error: 'Invalid or expired session.' });
            }

            const userId = decodedTempToken.id;

            const encryptedSecret= await DBget.get2FaSecret(userId);
            if (!encryptedSecret) {
                flog.warn({ function: 'verifyLoginTwoFactor', userId }, '2FA secret not found in DB for user during login.');
                return reply.code(400).send({ error: '2FA is not properly configured for this user.' });
            }

			const plainTextSecret = decrypt(encryptedSecret);
				
            const isVerified = speakeasy.totp.verify({
                secret: plainTextSecret,
                encoding: 'base32',
                token: otp
            });

            if (isVerified) {
                flog.info({ function: 'verifyLoginTwoFactor', userId }, 'Login OTP verified. Issuing final token.');

                const finalToken = secure.generateToken({ id: userId }, decodedTempToken.username);
                secure.setAuthCookie(reply, finalToken);
                reply.code(200).send('ok');
            } else {
                flog.warn({ function: 'verifyLoginTwoFactor', userId }, 'Invalid login OTP provided.');
                reply.code(401).send({ error: 'Invalid 2FA code.' });
            }
        } catch (err) {
			flog.error({
        	function: 'verifyLoginTwoFactor',
        	errorMsg: err.message || err.error,
        	errorStack: err.stack,
        	rawError: err
			}, 'Error during 2FA login verification.');
            reply.code(418).send({ error: 'An error occurred during 2FA login verification.' });
        }
    });
}

async function authRoutes(fastify, options) {
	await registerUser(fastify, options);
	await loginUser(fastify, options);
	await logoutUser(fastify, options);
	await deleteUser(fastify, options);
	await setupTwoFactor(fastify, options);
	await verifyTwoFactor(fastify, options);
	await disableTwoFactor(fastify, options);
	await getTwoFactorStatus(fastify, options);
	await verifyLoginTwoFactor(fastify, options);
}

module.exports = authRoutes;
