Setup:
- run EngineSetup.sh
- create an AWS S3 bucket to contain the data for your game
- create an AWS global key in IAM (not safe for production)
- create .env
Example:
    DEBUG_MODE=Light
    USE_MEMORY_FRONTEND=TRUE
    AWS_ID=YourAwsId
    AWS_KEY=YourAwsKey
    AWS_BUCKET_NAME=YourBucketName

Start Editor:
run StartEditor.sh

Start Development:
On vscode:
run debug mode to debug server (F5)
No vscode:
run TODO: StartDevelopment.sh

Check Backend Performance:
Open Prometheus to see graphed data (localhost:3000)
TODO: make dashboard part of repo

Build Production:
TODO: build client & server

Extend Code:
TODO: use the Source/Client for any frontend code - include BabylonBoostClient to use any of those exports
TODO: use Source/Server for any server code - paths should be auto resolved