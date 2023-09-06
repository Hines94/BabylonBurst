#pragma once
#include "Engine/Entities/Core/EntVector3.hpp"
#include "Engine/Entities/EntitySystem.h"
#include "recastnavigation/DetourNavMesh.h"
#include <optional>

class dtNavMeshQuery;

/** We can use these to check if the data is outdated */
struct CachedNavElement {
    std::string AwsPath;
    std::string MeshName;

    bool operator==(const CachedNavElement& rhs) const {
        if (AwsPath != rhs.AwsPath) {
            return false;
        }
        if (MeshName != rhs.MeshName) {
            return false;
        }
        return true;
    }

    bool operator!=(const CachedNavElement& other) const {
        return !(*this == other);
    }

    template <typename Packer>
    void msgpack_pack(Packer& pk) const {
        std::vector<std::string> data = {AwsPath, MeshName};
        pk.pack(data);
    }

    void msgpack_unpack(msgpack::object const& o) {
        std::vector<std::string> data;
        o.convert(data);
        AwsPath = data[0];
        MeshName = data[1];
    }
};

//Saved navmesh data for a specific Navmesh setup. Adding new navmesh elements/changing settings will require rebuild.
CCOMPONENT(NONETWORK)
//When a overall navmesh has been built access data through this
struct LoadedNavmeshData : public Component {

    DECLARE_COMPONENT_METHODS(LoadedNavmeshData)

    CPROPERTY(NOTYPINGS, SAVE)
    std::string navmeshData;

    //TODO: Add options saved with in case those change
    CPROPERTY(NOTYPINGS, SAVE)
    std::vector<CachedNavElement> savedSetup;

    dtNavMesh loadednavmesh;

    //Helper functions

    //Could be anywhere on the navmesh
    bool IsNavmeshValid();
    std::optional<EntVector3> GetRandomPointOnNavmesh();
    dtNavMeshQuery* GetPremadeQuery(int maxNodes = 2048);

    void onComponentAdded(EntityData* entData) override;
};
