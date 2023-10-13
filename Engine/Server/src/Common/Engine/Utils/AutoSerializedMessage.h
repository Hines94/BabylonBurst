#pragma once
#include <cstdint>
#include <msgpack.hpp>
#include <vector>

//Use this to provide easy auto-serialization types for your message (usually from a player).
//Use DECLARE_AUTO_SERIALIZE_METHODS
struct AutoSerializedMessage {
    virtual std::vector<uint8_t> AutoSerialize() = 0;
    virtual void AutoDeserialize(std::vector<uint8_t> data) = 0;
    const msgpack::object* GetParamData(const std::string& key, const std::map<std::string, msgpack::object>& compData);
};

#define DECLARE_AUTO_SERIALIZE_METHODS()  \
    std::vector<uint8_t> AutoSerialize(); \
    void AutoDeserialize(std::vector<uint8_t> data);
//