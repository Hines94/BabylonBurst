#include "NetworkingManager.h"
#include "Entities/EntitySystem.h"
#include "Utils/ChronoUtils.h"
#include "Utils/PerfTracking.h"
#include "Utils/StringUtils.h"
#include <iostream>
#include <nlohmann/json.hpp>
#include <random>
#include <thread>

NetworkingManager* NetworkingManager::instance = nullptr;

//We still use JSON for client messages - convenience!
void from_json(const nlohmann::json& j, MessageFromPlayer& p) {
    j.at("MessageType").get_to(p.MessageType);
    j.at("Payload").get_to(p.Payload);
}

//TODO: Replace this with actual unique account Id
std::string generate_random_string(std::size_t length) {
    const std::string CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    std::random_device random_device;
    std::mt19937 generator(random_device());
    std::uniform_int_distribution<> distribution(0, CHARACTERS.size() - 1);

    std::string random_string;

    for (std::size_t i = 0; i < length; ++i) {
        random_string += CHARACTERS[distribution(generator)];
    }

    return random_string;
}

void NetworkingManager::SetupNetworkingManager() {
    // Create NetworkingManager
    new NetworkingManager(8080);
}

NetworkingManager::NetworkingManager(uint port) {
    NetworkingManager::instance = this;
    auto openHandler = [this](auto* ws) { handleOpen(ws); };
    auto messageHandler = [this](auto* ws, std::string_view message, uWS::OpCode opCode) {
        recieveMessage(ws, message, opCode);
    };
    auto closeHandler = [this](auto* ws, int code, std::string_view message) {
        handleClose(ws, code, message);
    };

    networkingLoop = uWS::Loop::get();
    uWS::App()
        .ws<ActiveSocketData>("/*", {/* Settings */
                                     .compression = uWS::SHARED_COMPRESSOR,
                                     .maxPayloadLength = 16 * 1024 * 1024,
                                     .idleTimeout = 10,
                                     .maxBackpressure = 1 * 1024 * 1024,
                                     /* Handlers */
                                     .open = openHandler,
                                     .message = messageHandler,
                                     .drain = std::bind(&NetworkingManager::handleDrain, this, std::placeholders::_1),
                                     .close = closeHandler})
        .listen(port, [port](auto* token) {
            if (token) {
                std::cout << "Networking listening started on port " << port << std::endl;
            }
        })
        .run();
}

NetworkingManager::~NetworkingManager() {
    //TODO: Close all active connections
}

void NetworkingManager::handleOpen(uWS::WebSocket<false, true, ActiveSocketData>* ws) {
    const std::string TEMP_FakeAccountId = generate_random_string(20);
    //Check already logged in
    if (reverse_sockets_.find(ws) != reverse_sockets_.end()) {
        std::cout << "ERROR: Already logged in!" << std::endl;
        return;
    }
    //TODO: Check last log in via prior (rate limit)
    sockets_.insert(std::make_pair(TEMP_FakeAccountId, ws));
    reverse_sockets_.insert(std::make_pair(ws, TEMP_FakeAccountId));
    //Insert as new connection so player can be made
    std::lock_guard<std::mutex> lock(newSocketMut);
    newSockets_.insert(TEMP_FakeAccountId);
    removedSockets_.erase(TEMP_FakeAccountId);
    std::cout << "Socket with ID " << TEMP_FakeAccountId << " has been opened" << std::endl;
    PerfTracking::getInstance().IncrementActivePlayers();
}

std::pair<msgpack::sbuffer*, msgpack::packer<msgpack::sbuffer>*> NetworkingManager::GetBufferToSend() {
    msgpack::sbuffer* sbuf = new msgpack::sbuffer();
    msgpack::packer<msgpack::sbuffer>* packer = new msgpack::packer<msgpack::sbuffer>(sbuf);
    auto pair = std::make_pair(sbuf, packer);
    //Precreate a map - the other details aWre filled out later
    packer->pack_map(3);
    //Preset that we will be filling the Payload in
    packer->pack("P");
    return pair;
}

void NetworkingManager::sendMessageToPlayer(std::string uuid, uint32_t messageType, std::pair<msgpack::sbuffer*, msgpack::packer<msgpack::sbuffer>*> message) {
    //Not connected?
    if (sockets_.find(uuid) == sockets_.end()) {
        return;
    }
    //Content should be preloaded

    //Load in message type
    message.second->pack("M");
    message.second->pack(messageType);

    //Load in time sent
    message.second->pack("T");
    message.second->pack(ChronoUtils::get_time_since_epoch());

    std::lock_guard<std::mutex> lock(sendMessageMut);
    auto socket = sockets_[uuid];
    messageQueues_[socket].push(message.first);
    networkingLoop->defer([this, socket]() {
        this->handleDrain(socket);
    });
    delete (message.second);
}

void NetworkingManager::handleDrain(uWS::WebSocket<false, true, ActiveSocketData>* ws) {
    std::lock_guard<std::mutex> lock(newSocketMut);
    auto& messageQueue = messageQueues_[ws];

    // Send all queued messages
    while (!messageQueue.empty()) {
        if (ws) {
            auto item = messageQueue.front();
            auto size = item->size();
            auto deflated = StringUtils::DeflateStringView(std::string_view(item->data(), size));
            auto result = ws->send(deflated, uWS::OpCode::BINARY, false, true);

            dataSizeOutBytes += size;

            // If there's backpressure, stop sending and wait for the next drain event
            if (result == 0) {
                break;
            }
        }

        //Sending element is no longer needed (new sending element)
        if (sendingBuffer) {
            delete (sendingBuffer);
        }
        // Remove the sent message from the queue
        auto element = messageQueue.front();
        messageQueue.pop();
        sendingBuffer = element;
    }
}

void NetworkingManager::recieveMessage(uWS::WebSocket<false, true, ActiveSocketData>* ws, std::string_view message, uWS::OpCode opCode) {
    //Get player ID
    auto it = reverse_sockets_.find(ws);
    if (it == reverse_sockets_.end()) {
        return;
    }
    std::string uuid = it->second;
    //Get type of message
    MessageFromPlayer requestMess;
    try {
        requestMess = nlohmann::json::parse(message).get<MessageFromPlayer>();
    } catch (nlohmann::json::parse_error& e) {
        std::cerr << "ERROR: issue decoding message from player " << e.what() << std::endl;
        return;
    }
    std::unique_lock lock(newMessageMut);
    if (playerMessages.find(requestMess.MessageType) == playerMessages.end()) {
        playerMessages.insert(std::pair(requestMess.MessageType, std::vector<std::pair<std::string, std::string>>()));
    }
    playerMessages[requestMess.MessageType].push_back(std::pair(uuid, requestMess.Payload));
}

void NetworkingManager::handleClose(uWS::WebSocket<false, true, ActiveSocketData>* ws, int code, std::string_view message) {
    // Find the socket in the reverse map
    auto it = reverse_sockets_.find(ws);

    if (it != reverse_sockets_.end()) {
        std::string uuid = it->second;

        // Create a ClosedSocketData object and store the last login time
        ClosedSocketData csd;
        csd.lastLogin = std::time(nullptr);

        // Store the ClosedSocketData in the closedSockets map
        priorSockets_[uuid] = csd;

        // Remove the WebSocket from the active sockets map
        sockets_.erase(uuid);
        reverse_sockets_.erase(it);

        std::cout << "Socket with ID " << uuid << " has been closed.\n";
        PerfTracking::getInstance().DecrementActivePlayers();

        std::lock_guard<std::mutex> try_lock(newSocketMut);
        removedSockets_.insert(uuid);
        newSockets_.erase(uuid);
    }
}

void NetworkingManager::RecordDataOut() {
    PerfTracking::getInstance().UpdateDataOut(dataSizeOutBytes);
    dataSizeOutBytes = 0;
}