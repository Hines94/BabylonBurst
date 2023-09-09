#pragma once
//We use map to make things easier
#define MSGPACK_USE_DEFINE_MAP
#include "MacroHelpers.h"
#include <msgpack.hpp>
#include <string>

namespace MsgpackHelpers {
    std::string ensureKeyIsString(msgpack::object const& obj);

    template <typename Packer>
    inline void packMapSize(Packer& pk, int size) {
        pk.pack_map(size);
    }
} // namespace MsgpackHelpers

// --- Useful macros for auto packing our data for any custom components ---
#define PACK_SINGLE(VAR) \
    pk.pack(#VAR);       \
    pk.pack(VAR);

#define MSGPACK_PACK_FUNC(...)                \
    template <typename Packer>                \
    void msgpack_pack(Packer& pk) const {     \
        pk.pack_map(COUNT_ARGS(__VA_ARGS__)); \
        APPLY(PACK_SINGLE, __VA_ARGS__)       \
    }

// --- Useful macros for auto unpacking our data for any custom components ---
#define UNPACK_SINGLE(VAR)                       \
    if (data.find(#VAR) != data.end()) {         \
        VAR = data.at(#VAR).as<decltype(VAR)>(); \
    }

#define MSGPACK_UNPACK_FUNC(...)                     \
    void msgpack_unpack(msgpack::object const& o) {  \
        if (o.type != msgpack::type::MAP) {          \
            return;                                  \
        }                                            \
        std::map<std::string, msgpack::object> data; \
        o.convert(data);                             \
        APPLY(UNPACK_SINGLE, __VA_ARGS__)            \
    }
