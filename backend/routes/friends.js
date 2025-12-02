const { API_PROTOCOL } = require('@sharedApi');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'friend.js' }); // scoped logger


async function addFriend(fastify, options)
{
	
	const {DBinsert, DBget} = options;
	fastify.post(API_PROTOCOL.ADD_FRIEND.path, async (request, reply) => {
			const username = request.body.username;
			const userId = request.userId; 
			if (!userId) return reply.code(401).send({error: 'Authentication required'});
			if(!username || typeof username !== 'string')
				return reply.code(400).send({error: 'Username is required'});
			try
			{
				const friendId = await DBget.fetchUserByUsername(username);
				if (friendId === userId)
					return reply.code(400).send({error: 'Cannot add yourself as a friend'});
				const result =  await DBinsert.insertFriend(friendId, userId);
				reply.code(200).send({status: "ADDED", friend: username, friendId});
			}
			catch (err)
			{
				reply.code(418).send({status: "ERROR", friend: username, error: err});
			}
		});
}

async function removeFriend(fastify, options)
{
	const {DBdelete} = options;
	fastify.post(API_PROTOCOL.REMOVE_FRIEND.path, async (request, reply) => {
			const friendId = request.body.friend_id
			const userId = request.userId;
			if (!userId)
				return reply.code(401).send({error: 'Authentication required'})
			if (!friendId)
				return reply.code(400).send({error: 'Friend ID is required'});
			try
			{
				const changes = await DBdelete.deleteFriendById(userId, friendId);
				if (!changes)
					return reply.code(404).send({ error: 'Friendship not found' });
				reply.code(200).send({status: "REMOVED"})
			}
			catch (err)
			{
				reply.code(418).send({status: 'ERROR', error: 'Failed to remove friend'});
			}
		});
}

async function friendRoutes(fastify, options){
	await addFriend(fastify, options);
	await removeFriend(fastify, options);
}
module.exports = friendRoutes;