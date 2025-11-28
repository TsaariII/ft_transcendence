const { API_PROTOCOL } = require('@sharedApi');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'friend.js' }); // scoped logger


async function addFriend(fastify, options) {
	
	const {DBinsert, DBget} = options;
	fastify.route ({
		method: API_PROTOCOL.ADD_FRIEND.method,
		url: API_PROTOCOL.ADD_FRIEND.path,
		handler: async (request, reply) => {
			const username = request.body.username;
			try {
				const userId = request.userId; 
				const friendId = await DBget.fetchUserByUsername(username);
				await DBinsert.insertFriend(friendId, userId);
				reply.code(200).send({
					status: "ADDED",
					friend: username,
					friendId: friendId,
				})
			} catch (err) {
				reply.code(418).send({
					status: "ERROR",
					friend: username,
					error: err,
				}
				);

			}
		}
	});
}


async function removeFriend(fastify, options)
{
	const {DBdelete} = options;
	fastify.route ({
		method: API_PROTOCOL.REMOVE_FRIEND.method,
		url: API_PROTOCOL.REMOVE_FRIEND.path,
		handler: async (request, reply) => {
			const friendId = request.body.friend_id
			const userId = request.userId;
			if (!userId)
				return reply.code(401).send({error: 'Authentication required'})
			if (!friendId)
				return reply.code(400).send({error: 'Friend ID is required'});
			try
			{
				await DBdelete.deleteFriendById(userId, friendId);
				reply.code(200).send({status: "REMOVED"})
			}
			catch (err)
			{
				reply.code(418).send({status: 'ERROR', error: 'Failed to remiove friend'});
			}
		}
	});
}

async function friendRoutes(fastify, options){
	await addFriend(fastify, options);
	await removeFriend(fastify, options);
}
module.exports = friendRoutes;