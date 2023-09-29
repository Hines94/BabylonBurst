#pragma once
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Utils/MathUtils.h"
#ifdef PHYSICS
#include <bullet/btBulletDynamicsCommon.h>
#endif
#include <msgpack.hpp>
#include <nlohmann/json.hpp>

struct EntVector3 {
    //Tracked for changes if vector3 is tracked
    CPROPERTY(float, X, NO_DEFAULT);
    //Tracked for changes if vector3 is tracked
    CPROPERTY(float, Y, NO_DEFAULT);
    //Tracked for changes if vector3 is tracked
    CPROPERTY(float, Z, NO_DEFAULT);

    EntVector3(float x = 0.0f, float y = 0.0f, float z = 0.0f)
        : X(x), Y(y), Z(z) {}
#ifdef PHYSICS
    operator btVector3() const {
        return btVector3(X, Y, Z);
    }
#endif

    bool operator==(const EntVector3& other) const {
        return X == other.X && Y == other.Y && Z == other.Z;
    }

    bool operator!=(const EntVector3& other) const {
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

//---- AUTOGENERATED ---
#include "Engine/Entities/Core/EntVector3_autogenerated.h"
//--- AUTOGENERATED END ---