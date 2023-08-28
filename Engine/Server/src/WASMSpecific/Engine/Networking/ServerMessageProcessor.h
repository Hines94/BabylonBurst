#pragma once
#include <string>
#include <vector>

namespace NetworkManager {
    void ProcessServerMessage(std::vector<uint8_t> messageData);

    inline std::vector<std::pair<std::string, std::vector<std::string>>> componentMappings;
} // namespace NetworkManager