#include "Building/BuildingSystem.h"
#include "Engine/GameLoop/CommonGameLoop.h"
#include "Player/FlyingPlayerController.hpp"

REGISTER_MIDDLE_SYSTEM_UPDATE(flyController, FlyingPlayerController::UpdatePlayerControllers, -1)
REGISTER_MIDDLE_SYSTEM_UPDATE(buildSystem, BuildingSystem::UpdateBuildSystem, -1)