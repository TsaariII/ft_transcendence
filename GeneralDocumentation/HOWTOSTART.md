# where the project stands right now
- A game of pong can be ran , the game is in its simplest for with no winner looser mechanics yet .
- Front end and backend are capable of communicating but not all paths are set up with handlers.
- Database is bare bones at this moment, expected to see progress very soon
- Tokens and cookies are at their simplest
- parsing of some data is being managed at front end, backend is ready for writing
schemas , These will drop later when we have fuller testability
 
---
# usage 
required installs :
- node.js & npm for backend (run npm install in backend dir)
- *front end requirements* (run npm install in frontend dir)

To test backend frontend:
- In /backend :terminal: npm start (this will run /backend/server.js)
- In /frontend :terminal: npm run dev (this will run /frontend/?)
This should open a browser and prompt a register/login, password and name have restrictions. Once logged/registered access to content is available

To test backend game flow (frontend imitation):
- In /backend :terminal: npm start (this will run /backend/server.js)
- Open firefox browser(others may have strict restrictions), in the url
put::        http://localhost:3000/test_harness/index.html

This will take a moment due to test_harness/index.html waiting 1000ms before starting pong_game/index.html (gives you a moment in browser dev tools to see data from test_harness/index.html)

- Game, only local play at this moment use w+s for left paddle or arrows keys to move right paddle. (no game win/loose mechanics yet)


# testing tools

- thunder client vs code extension (not required but nicer tool for backend testing)
- Fastify.inject() (not tried yet)
- jest (not tried yet)
---

Navigate to practise1 folder

Install dependencies from package.json using npm install, this will load from the node_modules,
This should be done in backend directory for backend functionality, and frontend directory 
for frontend fucntionality 

Navigate to backend directory npm start (to start the "server")

Open thunder client and make new request to simple test backend

----
#### docker 

To Build the backend image run command: docker build -t backend .
Then to run server run command: docker run --rm -p 3000:3000 backend

- To access images shell run command: docker exec -it <images_name> sh
- To access database run command in images shell: sqlite3 data/app.sqlite
- If you want to see what tables we have run command in sqlite: .tables
- If you want to see what's inside users table run command in sqlite: SELECT * FROM users;

----

You can make a POST request http://localhost:3000/register
This requires you fill in also json below 

```json
{
	"username": "name",
	"password": "pass",
}
```
- Follow the code routes/user.js  resgisterUser().

as the shared directories grow in both frontend and backend, we can utalize the api protocols and payloads as examples
---

# Cybersecurity
## Major module
	Implement WAF/ModSecurity with Hardened Configuration and HashiCorp Vault for Secrets Management

### ModSecurity

- it's a firewall, the nginx-based version (works with nginx as reverse proxy) 
- works with OWASP CRS

### HashiCorp Vault

- stores variables securely and shares the volume with backend to provide the variables

How to test:
- enter the backend container and run cat /run/secrets/app.env --> it will show a key value
- enter the vault container and run
```
export VAULT_ADDR="http://127.0.0.1:8200"
vault login myroot
vault kv put secret/app JWT_SECRET="rotated-$(date +%s)"  DB_USER="pong" DB_PASS="super-strong" API_KEY_PAYMENT="pk_test_123"
vault kv get secret/app

docker compose exec backend sh -lc 'sed -n "1,20p" /run/secrets/app.env'
```
the last command will show the new key after 2-5 secs (you can check in the backend container as well)






