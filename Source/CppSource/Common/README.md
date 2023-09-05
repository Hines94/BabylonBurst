Add common code to be run in Server + WASM

If you want to seperate parts out use:
- #ifdef BBSERVER
- #ifdef BBCLIENT


- Use REGISTER_MIDDLE_SYSTEM_UPDATE (START/MIDDLE/END) (name, func(bool SystemInit,double dt), double rateLimit) to register system run on tick
- Use REGISTER_PLAYER_MESSAGE(id for message, function to process) to register message type client->server


Feel free to remove this readme but the folder name is important (Source/CppSource/Common)