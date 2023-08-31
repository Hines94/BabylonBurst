#pragma once
#include "ExtractedMeshData.h"
#include <msgpack.hpp>

namespace ExtractedMeshSerializer {
    msgpack::sbuffer GetBufferForExtractedMesh(const ExtractedModelData& data);

    ExtractedModelData GetDataFromMsgpackData(const msgpack::object_handle& oh);
} // namespace ExtractedMeshSerializer