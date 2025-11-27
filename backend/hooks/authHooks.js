//console.log('authHook plugin loaded');
const fp = require("fastify-plugin");
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'authHooks.js' });

const { API_PROTOCOL } = require('@sharedApi');
const { ERROR_CODES } = require('@sharedErr');
const { UNAUTHORIZED } = ERROR_CODES;

const excludedPaths = [
	API_PROTOCOL.LOGIN_USER, 
	API_PROTOCOL.REGISTER_USER,
	API_PROTOCOL.TFA_LOGIN_VERIFY,
]

function isExcluded(method, path)
{
	if (!path.startsWith('/api/')) return true;
	return excludedPaths.some((ep) => {
		if (!ep || !ep.method) return false;
		return ep.method.toUpperCase() === method.toUpperCase()
			&& ep.path === path;
	});
}


async function authHook(fastify, options) {
	const {secure} = options || {};
	if (!secure || typeof secure.getUserIdFromTokenH !== 'function')
	{
		flog.error(
			{function: 'authHook'},
			'secure.getUserIdFromTokenH is not available; auth hook misconfigure'
		);
	}
	fastify.addHook('onRequest', async (request, reply) => {
		const rawUrl = request.raw?.url || request.url || '';
		const [path] = rawUrl.split('?', 1);
		const method = (request.method || 'GET').toUpperCase();
		if (isExcluded(method, path)) return;
		const token = request.cookies?.auth_token;
		try
		{
			if (!secure || typeof secure.getUserIdFromTokenH !== 'function')
			{
				flog.error(
					{function: 'authHook'},
					'secure.getUserIdFromTokenH missing at runtime'
				);
				return reply.code(500).send({error: 'UNKNOWN_AUTH_ERROR'});
			}
			const result = secure.getUserIdFromTokenH(token);
			if (result && result.id)
			{
				request.userId = result.id;
				return;
			}
			if (result && result.error)
			{
				const mapped = UNAUTHORIZED(result.error);
				return reply.code(mapped.code).send({error: mapped.message});
			}
			const mapped = UNAUTHORIZED('DEFAULT_AUTH');
			return reply.code(mapped.code).send({error: mapped.message});
		}
		catch (err)
		{
			return reply.code(500).send({error: 'UNKNOWN_AUTH_ERROR'});
		}
	});
}

// culd apply a different hook here for refresh using above also 


module.exports = fp(authHook);
//fastify.get('/api/profile', async (request, reply) => {
//  const userId = request.user.id; // already set by middleware
//  const profile = await DBget.fetchUser({ userId });
//  reply.send(profile);
//});
