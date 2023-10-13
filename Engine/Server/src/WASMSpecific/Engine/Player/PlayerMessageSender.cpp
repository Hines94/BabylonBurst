#include "PlayerMessageSender.h"

namespace PlayerMessageSender {
    std::function<void(int, std::vector<uint8_t>)> PlayerMessageCallback;

    void SendMessageToServer(int messageId, std::vector<uint8_t> message) {
        if (PlayerMessageCallback) {
            PlayerMessageCallback(messageId, message);
        }
    }
} // namespace PlayerMessageSender
