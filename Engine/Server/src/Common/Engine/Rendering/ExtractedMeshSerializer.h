#pragma once
#include <msgpack.hpp>
#include "ExtractedMeshData.hpp"

namespace ExtractedMeshSerializer {
    msgpack::sbuffer GetBufferForExtractedMesh(const ExtractedModelData& data);

    ExtractedModelData GetDataFromMsgpackData(const msgpack::object_handle& oh);
}