#pragma once
#ifndef NETWORKING_MESSAGE_TYPES_H
#define NETWORKING_MESSAGE_TYPES_H

//Type of message to player
enum class PlayerSendMessageType : uint32_t {
    EntitiesPayload,
    TEMP_PlayerID
};

//Type of Message from player
enum class PlayerRecieveMessageType : uint32_t {
    PlayerMessageInputs,
    PlayerMessageBuilding,
    PlayerMessageRemoveBuild,
    PlayerMessageInteract,
    PlayerBeginBuilding,
    PlayerAddDecal
};

#endif // NETWORKING_MESSAGE_TYPES_H