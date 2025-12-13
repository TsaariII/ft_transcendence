
// example of a hook, which is middleware that runs before each request
fastify.addHook('onRequest', async (request, reply) => {
  try {
    const token = request.cookies.auth_token;
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded; // attach user info to request
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});
//usage of hook above
fastify.get('/profile', async (request, reply) => {
  const user = await db.getUserById(request.user.id);
  reply.send(user);
});
