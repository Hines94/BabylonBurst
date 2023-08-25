#include "MsgpackHelpers.h"
#include <iostream>

std::string MsgpackHelpers::ensureKeyIsString(msgpack::object const& obj) {
    if (obj.type == msgpack::type::POSITIVE_INTEGER || obj.type == msgpack::type::NEGATIVE_INTEGER) {
        return std::to_string(obj.as<int>());
    } else if (obj.type == msgpack::type::STR) {
        return obj.as<std::string>();
    } else {
        std::cerr << "Error type passed to entity Loader: " << obj.type << std::endl;
        throw msgpack::type_error();
    }
}