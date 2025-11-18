'use strict';
require('module-alias/register'); // enables aliases
require('dotenv').config({ path: process.env.SECRETS_FILE || '/run/secrets/app.env' });
const path = require('path');
const cookie = require('@fastify/cookie');
const { logger, log } = require('@logger');

// This enables automatic HEAD handling
const fastify = require('fastify')({ 
    logger, 
    disableHeadRoute: false 
});

// Hooks & contexts
const authHooks = require('@hooks/authHooks.js');
const authHookContext = require('@hooks/authContext.js');

// Shared DB/security context for most routes
const appContext = require('@context');

// Routes
const friendRoutes = require('@routes/friends.js');
const tournamentRoutes = require('@routes/tournament/tournament.js');
const tournamentContext = require('@routes/tournament/context.js');
const authRoutes = require('@Rauth/auth.js');
const authcontext = require('@Rauth/context.js');
const profileRoutes = require('@Rprofile/profile.js');
const profilecontext = require('@Rprofile/context.js');
const {gameRoutes} = require('@Rgame');

// WebSocket
const setUpWebSockets = require('@Wbs/startUp.js');

const formatError = require("@errors");

// Basic health endpoint
fastify.get('/', async (req, reply) => {
    reply.send({ status: 'ok' });
});

fastify.get('/status', async (request, reply) => {
    return {status: "API is online!"};
});
// Register the multipart plugin (Mandatory for request.file() to work)

fastify.setErrorHandler((error, request, reply) => {
    if (error.validation) {
        const formatted = formatError.formatValidationError(error);
        reply.code(formatted.code).send({
            error: formatted.error,
            details: formatted.message
        });
    }
    reply.code(418).send({ 
        error: 'SERVER_ERROR', 
        message: error.message 
    });
});

// Log all incoming requests for testing and debugging
fastify.addHook('onRequest', async (request, reply) => {
        logger.trace({ 
            function: 'onRequest', 
            method: request.method, 
            url: request.url, 
            headers: request.headers, 
            body: request.body 
        }, 'Incoming request');
});

// Server bootstrap
const start = async () => {
    try {
        log('STARTING SERVER', '---------------------------------------------');
        //    await fastify.listen({ port: 3000 });
        await fastify.register(cookie);
        fastify.register(require('@fastify/multipart'), {
            limits: {
                // 2MB file upload limit
                fileSize: 1024 * 1024 * 2,
            }
        });
        // Hooks
        await fastify.register(authHooks, authHookContext);
        
        // Auth & profile routes
        await fastify.register(authRoutes, authcontext);
        await fastify.register(profileRoutes, profilecontext);
        
        // Domain routes
        await fastify.register(tournamentRoutes, tournamentContext);
        await fastify.register(friendRoutes, appContext);
        await fastify.register(gameRoutes, appContext);
        
        // Static files: user avatars
        await fastify.register(require('@fastify/static'), {
            root: path.join(__dirname, 'public', 'avatars'),
            prefix: '/api/avatars',
            serve: true,
            decorateReply: false
        });

        // Static file: pong frontend
        await fastify.register(require('@fastify/static'), {
            root: path.join(__dirname, 'pong_game'),
            prefix: '/pong_game/',
            index: false,
            decorateReply: false
        });

        // Start HTTP server
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        fastify.log.info('Server listening on port 3000')

        // Attach WebSocket server to the underlying HTTP server
        setUpWebSockets(fastify.server);
        console.log('WebSocket server is running');
        
        fastify.ready();
        console.log('\n=== Registered routes ===');
        console.log(fastify.printRoutes());
        console.log('=========================\n');
    }
    catch (err)
    {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

