#include "Engine/Player/PlayerMessageProcessor.h"
#include "PlayerInputBeginBuilding.hpp"
#include "PlayerInputMovement.hpp"
#include "PlayerInputPlaceItem.hpp"

// Note: In this example all in one file - could be split
REGISTER_PLAYER_MESSAGE(0, PlayerMoveProcessor::processPlayerMovementInput)
REGISTER_PLAYER_MESSAGE(1, PlayerBeginBuildProcessor::processPlayerBeginBuildInput)
REGISTER_PLAYER_MESSAGE(2, PlayerItemPlaceProcessor::processPlayerPlaceItemInput)