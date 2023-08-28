#pragma once
#include <msgpack.hpp>
#include <string>

namespace MsgpackHelpers {
    std::string ensureKeyIsString(msgpack::object const& obj);
} // namespace MsgpackHelpers
