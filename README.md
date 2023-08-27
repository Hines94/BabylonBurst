Setup:
- Install WSL
- create an AWS S3 bucket to contain the data for your game
- create an AWS global key in IAM (not safe for production)
- Clone this directory (git clone https://github.com/Hines94/BabylonBoost.git) into WSL
- run EngineSetup.sh
- create .env at the same level as this README
    Example:
        DEBUG_MODE=Light
        USE_MEMORY_FRONTEND=TRUE
        AWS_ID=YourAwsId
        AWS_KEY=YourAwsKey
        AWS_BUCKET_NAME=YourBucketName
        AWS_BUCKET_REGION=ap-southeast-2
        #Cut out the physics engine (bullet)?
        NO_PHYSICS=false

Start Editor:
run StartEditor.sh

Start Development:
On vscode + wsl extension:
run debug mode to debug server (F5)
No vscode:
run bash StartDev.sh

Check Backend Performance:
Open Prometheus to see graphed data (localhost:3000)
Import the Grafana Dashboard (in Engine/Tools)

Build Production:
TODO: build client & server

Extend Code:
TODO: use the Source/Client for any frontend code - include BabylonBoostClient to use any of those exports
TODO: use Source/Server for any server code - paths should be auto resolved