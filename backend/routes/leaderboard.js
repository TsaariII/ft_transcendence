const {API_PROTOCOL} = require('@sharedApi');
const {logger} = require('@logger');
const flog = logger.child({fileContext: 'leaderboard.js'});

async function leaderboardRoutes(fastify, options)
{
    const {DBget} = options;
    fastify.get(API_PROTOCOL.GET_LEADERBOARD.path, async (request, reply) => {
        try
        {
            const limitParam = request.query && request.query.limit;
            let limit = 10;
            if (typeof limitParam === 'string')
            {
                const parsed = parseInt(limitParam, 10);
                if (!Number,isNaN(parsed) && parsed > 0 && parsed < 50)
                    limit = parsed;
            }
            const rows = await DBget.getLeaderboard(limit);
            const leaders = rows.map((r) => ({
                username: r.username,
                avatar: r.avatar_file || null,
                score: r.score,
                rank: r.rank,
                online_status: r.status === 'online'
            }));
            return reply.code(200).send({status: 'OK', leaders});
        }
        catch (err)
        {
          return reply.code(500).send({ status: 'ERROR', error: 'Failed to fetch leaderboard' });  
        }
    });
}

module.exports = leaderboardRoutes;