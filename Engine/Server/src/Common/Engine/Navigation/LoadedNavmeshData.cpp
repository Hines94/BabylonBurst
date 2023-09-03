#include "LoadedNavmeshData.h"

void LoadedNavmeshData::onComponentAdded(EntityData* entData) {
    if (navmeshData.empty()) {
        return;
    }
    auto status = loadednavmesh.init(reinterpret_cast<unsigned char*>(&navmeshData[0]), navmeshData.size(), DT_TILE_FREE_DATA);
    if (dtStatusFailed(status)) {
        std::cerr << "Failed to init navmesh with saved data!" << std::endl;
    }
}