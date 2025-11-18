//console.log('authHook plugin loaded');
const fp = require("fastify-plugin");
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'authHooks.js' });



const { API_PROTOCOL } = require('@sharedApi');
const { ERROR_CODES } = require('@sharedErr');
const { UNAUTHORIZED } = ERROR_CODES;

const excludedPaths = [
	API_PROTOCOL.LOGIN_USER, //post
	API_PROTOCOL.REGISTER_USER, //post
	API_PROTOCOL.TFA_LOGIN_VERIFY,
]
//if we make the routes include query strings or dynamic segments
//const path = request.routerPath || request.raw.url;
//if (excludedPaths.includes(path)) return;
///aaaa
async function authHook(fastify, options) {
  // this example below is how we could use it if i register the ocntext as an object called context
  // om not sure if it matters which way, but this insinutaes we could attatch way more here
  // potentailly removing all requires from top into that context file
	//const { DBget } = options.context;
	flog.info({function: "authHook"}, 'Entering authook');
	const {secure} = options;
	fastify.addHook("onRequest", async (request, reply) => {
		if (request.method === 'HEAD' && request.raw.url === '/') {
		  return; // Skip auth for HEAD /
		}
		if (request.method === 'GET' && request.raw.url === '/status'){
			return;
		}
		const path = request.routeOptions?.url || request.raw.url;

		//		const path = request.routerPath;
	//	flog.debug({ function: "authHook", path, match: excludedPaths.includes(path) }, "Exclusion check");

//const path = request.routerPath;
		const method = request.method;
		// for tester maybe only
	//	flog.warn({fucntion : 'authHook', method: method}, "lets see if we catch the head method");
		//if (request.method === 'HEAD') return;

		const isExcluded = excludedPaths.some(route =>
		  route.path === path && route.method === method
		);

		if (isExcluded) {
			flog.debug({ function: "authHook", routerPath: path, routerMethod: method, routeUrl: request.routeOptions?.url }, "Checking path exclusion for this path");
			return;
		}


	//	if (excludedPaths.includes(request.routerPath)) {
	//		flog.debug({ function: "authHook", routerPath: request.routerPath, routeUrl: request.routeOptions?.url }, "Checking path exclusion for this path");
    //		return; // Skip auth for these routes
	//	}

		const token = request.cookies?.auth_token;
		try
		{
			const result = secure.getUserIdFromTokenH(token);
			flog.debug({function: "authHook", result: result},'id decoded');
			if (result?.id)
				request.userId = result.id;
			else if (result.error) {
				flog.error({function: "authHook", errMsg: result.error},'error from getuserIdFromToken');
				const errorResponse = ERROR_CODES.UNAUTHORIZED(result.error);
				return reply.code(errorResponse.code).send({ error: errorResponse.message });
			}
		} catch (err) {
			flog.error({function: "authHook", errMsg: err.stack},'unknown error');
			reply.code(500).send({error: 'UNKNOWN_AUT_ERROR'});
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
