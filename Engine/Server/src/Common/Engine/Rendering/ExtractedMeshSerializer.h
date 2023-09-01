#pragma once
#include "ExtractedMeshData.h"
#include <msgpack.hpp>

namespace ExtractedMeshSerializer {
    msgpack::sbuffer GetBufferForExtractedMesh(const ExtractedModelData& data);

    ExtractedModelData GetDataFromMsgpackData(const msgpack::object_handle& oh);

    msgpack::sbuffer GetBufferForLinesVector(std::vector<LineSegment>& lines);
} // namespace ExtractedMeshSerializer