#pragma once
#include <msgpack.hpp>
#include <string>
//We use map to make things easier
#define MSGPACK_USE_DEFINE_MAP

namespace MsgpackHelpers {
    std::string ensureKeyIsString(msgpack::object const& obj);
} // namespace MsgpackHelpers