# Goals:
The overall goal is to take all of the "heavy lifting" away so that the developers can focus solely on making clean game related code.
- Full ECS system to track game data and logic
- Async asset loading and streaming
- Backwards compatability for Engine upgrades
- Integrated Editor to maximise productivity & debugging
- Full BabylonJS integration and max client performance
- TODO: Automatic login & utils for multiplayer games
- TODO: Automatic performance tracking
- TODO: Automatic networking

> Please see https://hines94.github.io/BabylonBurst for detailed docs and https://forum.babylonjs.com/t/43444 for more info.

NOTE: The engine  has recently gone through some large changes with all C++/WASM removed and replaced with typescript due to client performance issues. Networking and server is has been removed, but will be re-added at a later date (to similar functionality as previous).

## Setup:
- run EngineSetup.sh
- create .env at the same level as this README
    - see .env.sample

## Start Editor:
- run bash StartEditor.sh

## Start Development:
- On vscode:
    - run debug mode to debug server (F5)
- No vscode:
    - run bash StartDev.sh

## Working With Examples:
Simply copy the Source folder into your Source folder and re-run

## Git & Engine Upgrades:
- Git will come with history from BabylonBoost engine
    - (OPTIONAL) - delete this
    - (OPTIONAL) - work from a branch
- Upgrading from any git history
    - Run 'bash EngineUpgrade.sh' 
    - Should automatically copy over any engine changes
    - If you have changed Engine code you may need to resolve any conflicts by hand

## TODO's and upcoming

Check Backend Performance:
TODO: Open Prometheus to see graphed data (localhost:3000)
Import the Grafana Dashboard (in Engine/Tools)

Build Production:
TODO: build client & server

Future ideas:
- TODO: Future iterations include tools for login & account management on AWS & integrate directly into Engine
- TODO: Future iterations include tools for deployment to AWS
- TODO: Future iterations support for GameLift with matchmaking etc
- TODO: Future iterations support cloudfront to protect S3 & improve CDN speed
- TODO: Future iterations support skeletal mesh animator to make animations from ECS easy & support instancing 
- TODO: Future iterations support easy particle effects
- TODO: Future iterations support ECS audio play