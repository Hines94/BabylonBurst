#pragma once
#include "Entities/EntitySystem.h"
#include <msgpack.hpp>
#include <nlohmann/json.hpp>

struct EntVector4 {
    float X;
    float Y;
    float Z;
    float W;

    EntVector4(float x = 0.0f, float y = 0.0f, float z = 0.0f, float w = 0.0f)
        : X(x), Y(y), Z(z), W(w) {}

    bool operator==(const EntVector4& other) {
        return X == other.X && Y == other.Y && Z == other.Z && W == other.W;
    }

    bool operator!=(const EntVector4& other) {
        return !(*this == other);
    }

    void Set(EntVector4 other) {
        X = other.X;
        Y = other.Y;
        Z = other.Z;
        W = other.W;
    }

    //TODO: This could potentially be more efficient by storing as a Array but far harder client side
    template <typename Packer>
    void msgpack_pack(Packer& pk) const {
        std::map<std::string, float> data = {{"X", X}, {"Y", Y}, {"Z", Z}, {"W", W}};
        pk.pack(data);
    }

    void msgpack_unpack(msgpack::object const& o) {
        std::map<std::string, float> data;
        o.convert(data);
        X = data["X"];
        Y = data["Y"];
        Z = data["Z"];
        W = data["W"];
    }
};

inline void from_json(const nlohmann::json& j, EntVector4& p) {
    j.at("X").get_to(p.X);
    j.at("Y").get_to(p.Y);
    j.at("Z").get_to(p.Z);
    j.at("W").get_to(p.W);
}