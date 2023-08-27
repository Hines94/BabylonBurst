#pragma once
#include "Entities/EntitySystem.h"
#include "Utils/MathUtils.h"
#ifdef PHYSICS
#include <bullet/btBulletDynamicsCommon.h>
#endif
#include <msgpack.hpp>
#include <nlohmann/json.hpp>

struct EntVector3 {
    float X;
    float Y;
    float Z;

    EntVector3(float x = 0.0f, float y = 0.0f, float z = 0.0f)
        : X(x), Y(y), Z(z) {}
#ifdef PHYSICS
    operator btVector3() const {
        return btVector3(X, Y, Z);
    }
#endif

    bool operator==(const EntVector3& other) {
        return X == other.X && Y == other.Y && Z == other.Z;
    }

    bool operator!=(const EntVector3& other) {
        return !(*this == other);
    }

    EntVector3 Normalize() {
        double magnitude = std::sqrt(X * X + Y * Y + Z * Z);
        return EntVector3(
            X / magnitude,
            Y / magnitude,
            Z / magnitude);
    }

    template <typename Packer>
    void msgpack_pack(Packer& pk) const {
        std::map<std::string, float> data = {{"X", X}, {"Y", Y}, {"Z", Z}};
        pk.pack(data);
    }

    void msgpack_unpack(msgpack::object const& o) {
        std::map<std::string, float> data;
        o.convert(data);
        X = data["X"];
        Y = data["Y"];
        Z = data["Z"];
    }
};

inline void from_json(const nlohmann::json& j, EntVector3& p) {
    j.at("X").get_to(p.X);
    j.at("Y").get_to(p.Y);
    j.at("Z").get_to(p.Z);
}