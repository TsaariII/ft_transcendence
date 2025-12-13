You can create a file called .github/workflows/ci.yml in your repo, and GitHub will automatically run it every time you push code or open a pull request.example

```yaml

name: CI Pipeline

on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
    	- name: Checkout code # checkout the repo
    	uses: actions/checkout@v3

    	- name: Install dependencies # checks dependencies are installable, beware, backend uses older versions of certain dependencies
        	run: npm install

    	- name: Run tests # would run self made tests
        	run: npm test # You can add reporting here too

        - name: Run basic script
        	run: node server.js # or any entry point you want to test

        - name: Lint code # checks for common syntax issues, Make sure you have a lint script in package.json 
        	run: npm run lint

        # optional: Add a fun success message
    	- name: Celebrate success
        	if: success()
        	run: echo "CI passed!"

      #  optional: Notify on failure (Slack, Discord, etc.)
      # - name: Send failure alert
      #   if: failure()
      #   run: curl -X POST -H "Content-Type: application/json" -d '{"text":"Build failed!"}' https://your-webhook-url
```

Two seperate yaml files could be created , to test personal pushes and seperatley test pull requests or merges. This file could send a notification to discord to request a review . 
