#include "AutoSerializedMessage.h"

const msgpack::object* AutoSerializedMessage::GetParamData(const std::string& key, const std::map<std::string, msgpack::object>& compData) {
    auto it = compData.find(key);
    if (it == compData.end()) {
        return nullptr;
    }
    return &(it->second);
}
