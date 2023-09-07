Goals:
The overall goal is to take all of the "heavy lifting" away so that the developers can focus solely on making clean game related code.
- Maximum convenience for making game code (macros like REGISTER_MIDDLE_SYSTEM_UPDATE to register new systems)
- Maximum performance and parallelistaion
- Automatic performance tracking
- Automatic networking
- Backwards compatability for Engine upgrades
- Integrated Editor to maximise productivity & debugging
- TODO: Automatic login & utils for multiplayer games
- Full BabylonJS integration and max client performance

Setup:
- Install WSL
- create an AWS S3 bucket to contain the data for your game
- create an AWS global key in IAM (not safe for production)
- Clone this directory (git clone https://github.com/Hines94/BabylonBurst.git) into WSL
- run 'bash EngineSetup.sh'
- create .env at the same level as this README
    - See .env.sample for how to structure
    - Required: AWS_ID, AWS_KEY, AWS_BUCKET_NAME, AWS_BUCKET_REGION, DEBUG_MODE
VsCode:
- Install vscode extension
- Install c/c++ for WSL & extension pack
- Install CMake for WSL

Working With Examples:
Simply copy the CppSource and TsSource folders into your Source folder and re-compile

Start Editor:
run 'bash bbStartEditor.sh'

Start Development:
On vscode + wsl extension:
run debug mode to debug server (F5)
No vscode:
run 'bash bbStartDev.sh'

Check Backend Performance:
Open Prometheus to see graphed data (localhost:3000)
Import the Grafana Dashboard (in Engine/Tools)

Build Production:
TODO: build client & server

Git & Engine Upgrades:
- Git will come with history from BabylonBurst engine
    - (OPTIONAL) - delete this
    - (OPTIONAL) - work from a branch
- Upgrading from any git history
    - Run 'bash bbEngineUpgrade.sh' 
    - Should automatically merge in changes from the engine
    - If you have changed Engine code you may need to resolve any conflicts

Extend Code C++:
- Be careful using .hpp and .h files - unless included in a .cpp they will not be compiled in
- Follow folder structure:
    Source
        CppSource
            Common - compiled into WASM + Server
            ServerSpecific - compiled into backend only
            WASMSpecific - compiled into WASM only
                WASM_INTERFACE - compiled with Emscripten for Embind (to make Typescript hooks into WASM - see Examples)
- Register systems to update by including "Engine/GameLoop/CommonGameLoop.h" and using REGISTER_MIDDLE_SYSTEM_UPDATE (START/MIDDLE/END)
- Register messages from players (clients) by REGISTER_PLAYER_MESSAGE(id for message, function to process)
- TODO: Custom messages to players from Server
- Any custom data structures to be saved/networked will require:
    - bool operator==(const CachedNavElement& rhs) const
    - bool operator!=(const CachedNavElement& other) const 
    - `template <typename Packer>`
        - void msgpack_pack(Packer& pk) const 
    - void msgpack_unpack(msgpack::object const& o)
    - And for now they need to pack into map with SAME NAME param in msgpack (eg TestParam -> {"TestParam",value}) to be compatible with Editor

Extend Code Typescript:
- Required: Main.ts in TsSource with export function UpdateTick(ecosystem:GameEcosystem) 
- Send messages to Server - if(serverConnection) { serverConnection.SendMessageToServer() }

Future ideas:
- TODO: Future iterations include tools for login & account management on AWS & integrate directly into Engine
- TODO: Future iterations include tools for deployment to AWS
- TODO: Include Blender tool for uploading models in an easy to use format
- TODO: Future iterations support for GameLift with matchmaking etc
- TODO: Future iterations support cloudfront to protect S3 & improve CDN speed
- TODO: Future iterations support skeletal mesh animator to make animations from ECS easy & support instancing 
- TODO: Future iterations support easy particle effects
- TODO: Future iterations support ECS audio play