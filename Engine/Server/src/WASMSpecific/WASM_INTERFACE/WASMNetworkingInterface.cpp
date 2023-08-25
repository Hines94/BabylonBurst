#include "Networking/ClientNetworkingData.hpp"
#include "Networking/ServerMessageProcessor.h"
#include <emscripten/bind.h>
#include <msgpack.hpp>

using namespace emscripten;

void ProcessServerMessage(std::vector<uint8_t> messageData) {
    NetworkManager::ProcessServerMessage(messageData);
}

double GetEstimatedLatency() {
    return ClientNetworkingData::EstimatedLatency;
}

std::string GetplayerId() {
    return ClientNetworkingData::playerId;
}

EMSCRIPTEN_BINDINGS(WASMNetworkingInterface) {
    function("ProcessServerMessage", &ProcessServerMessage);
    function("GetEstimatedLatency", &GetEstimatedLatency);
    function("GetplayerId", &GetplayerId);
}
