#pragma once
#include "uwebsockets/App.h"
#include <map>
#include <msgpack.hpp>
#include <mutex>
#include <queue>
#include <string>
#include <thread>
#include <unordered_set>

struct ActiveSocketData {
};

struct ClosedSocketData {
    std::time_t lastLogin;
};

struct MessageFromPlayer {
    uint MessageType;
    std::string Payload;
};

//Low level - Responsible for our raw networking - opening,closing sessions etc
class NetworkingManager {
public:
    static NetworkingManager* instance;
    static void SetupNetworkingManager();

    NetworkingManager(uint port);
    ~NetworkingManager();
    void stop();

    std::unordered_set<std::string> GetNewSockets() { return newSockets_; }
    std::unordered_set<std::string> GetRemovedSockets() { return removedSockets_; }
    std::mutex newSocketMut;
    void ResetNewSockets() {
        newSockets_.clear();
        removedSockets_.clear();
    }
    std::mutex newMessageMut;

    void RecordDataOut();

    //Generic send message to player - could be any player.
    void sendMessageToPlayer(std::string uuid, uint32_t messageType, std::pair<msgpack::sbuffer*, msgpack::packer<msgpack::sbuffer>*> message);

    static std::pair<msgpack::sbuffer*, msgpack::packer<msgpack::sbuffer>*> GetBufferToSend();

    std::map<uint, std::vector<std::pair<std::string, std::string>>> GetClearPlayerMessages() {
        std::unique_lock lock(newMessageMut);
        std::map<uint, std::vector<std::pair<std::string, std::string>>> copy = playerMessages;
        playerMessages.clear();
        return copy;
    }

private:
    void handleOpen(uWS::WebSocket<false, true, ActiveSocketData>* ws);
    void recieveMessage(uWS::WebSocket<false, true, ActiveSocketData>* ws, std::string_view message, uWS::OpCode opCode);
    void handleClose(uWS::WebSocket<false, true, ActiveSocketData>* ws, int code, std::string_view message);
    void handleDrain(uWS::WebSocket<false, true, ActiveSocketData>* ws);

    //Store their unique id too so we can stop any multiple logins per account etc
    std::map<std::string, uWS::WebSocket<false, true, ActiveSocketData>*> sockets_ = {};
    std::map<uWS::WebSocket<false, true, ActiveSocketData>*, std::string> reverse_sockets_ = {};
    std::map<std::string, ClosedSocketData> priorSockets_ = {};

    std::unordered_set<std::string> newSockets_ = {};
    std::unordered_set<std::string> removedSockets_ = {};
    std::map<uint, std::vector<std::pair<std::string, std::string>>> playerMessages = {};
    std::unordered_map<uWS::WebSocket<false, true, ActiveSocketData>*, std::queue<msgpack::sbuffer*>> messageQueues_ = {};
    std::mutex sendMessageMut;
    uWS::Loop* networkingLoop;
    uint dataSizeOutBytes;

    msgpack::sbuffer* sendingBuffer;
};
