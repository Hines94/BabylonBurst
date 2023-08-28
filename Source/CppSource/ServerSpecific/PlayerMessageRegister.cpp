#include "PlayerInputMovement.hpp"
#include "PlayerInputBeginBuilding.hpp"
#include "PlayerInputPlaceItem.hpp"
#include "Engine/Player/PlayerMessageProcessor.h"

//Note: In this example they are all in one file - could be anywhere... Just neater to put in one place?
REGISTER_PLAYER_MESSAGE(1, PlayerMoveProcessor::processPlayerMovementInput)
REGISTER_PLAYER_MESSAGE(2, PlayerBeginBuildProcessor::processPlayerBeginBuildInput)
REGISTER_PLAYER_MESSAGE(3, PlayerItemPlaceProcessor::processPlayerPlaceItemInput)