#pragma once
#include <functional>
#include <vector>

namespace PlayerMessageSender {
    extern std::function<void(int, std::vector<uint8_t>)> PlayerMessageCallback;

    void SendMessageToServer(int messageId, std::vector<uint8_t> message);
} // namespace PlayerMessageSender