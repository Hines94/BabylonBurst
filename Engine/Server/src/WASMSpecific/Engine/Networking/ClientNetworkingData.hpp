#pragma once
#include <string>

namespace ClientNetworkingData {
    //Unique ID that can be used to identify items belonging to this player
    inline std::string playerId;
    //Latency from server to client
    inline double EstimatedLatency;
} // namespace ClientNetworkingData