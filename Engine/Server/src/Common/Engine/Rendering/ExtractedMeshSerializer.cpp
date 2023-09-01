#include "ExtractedMeshSerializer.h"

msgpack::sbuffer ExtractedMeshSerializer::GetBufferForExtractedMesh(const ExtractedModelData& extractedData) {
    msgpack::sbuffer buffer;
    msgpack::packer<msgpack::sbuffer> pk(&buffer);

    pk.pack_map(2); // There are two main keys: "vertices" and "triangles"

    // Pack the vertices
    pk.pack_str(8); // The length of the string "vertices"
    pk.pack_str_body("vertices", 8);
    pk.pack_array(extractedData.vertices.size() * 3); // Each vertex has 3 floats
    for (const Vertex& v : extractedData.vertices) {
        pk.pack(v.x);
        pk.pack(v.y);
        pk.pack(v.z);
    }

    // Pack the triangles
    pk.pack_str(9); // The length of the string "triangles"
    pk.pack_str_body("triangles", 9);
    pk.pack_array(extractedData.triangles.size() * 3); // Each triangle has 3 uint32_t
    for (const Triangle& t : extractedData.triangles) {
        pk.pack(t.v1);
        pk.pack(t.v2);
        pk.pack(t.v3);
    }
    return buffer;
}

msgpack::sbuffer ExtractedMeshSerializer::GetBufferForLinesVector(std::vector<LineSegment>& segments) {
    msgpack::sbuffer buffer;
    msgpack::packer<msgpack::sbuffer> pk(&buffer);

    pk.pack_map(1); // There is one main key: "segments"

    // Pack the segments
    pk.pack_str(8); // The length of the string "segments"
    pk.pack_str_body("segments", 8);
    pk.pack_array(segments.size() * 6); // Each segment has 6 floats (startX, startY, startZ, endX, endY, endZ)

    for (const LineSegment& segment : segments) {
        pk.pack(segment.startX);
        pk.pack(segment.startY);
        pk.pack(segment.startZ);
        pk.pack(segment.endX);
        pk.pack(segment.endY);
        pk.pack(segment.endZ);
    }

    return buffer;
}

ExtractedModelData ExtractedMeshSerializer::GetDataFromMsgpackData(const msgpack::object_handle& oh) {
    msgpack::object obj = oh.get();
    ExtractedModelData extractedData;

    // Iterate through each key-value pair in the map
    for (uint32_t i = 0; i < obj.via.map.size; i++) {
        msgpack::object key = obj.via.map.ptr[i].key;
        msgpack::object val = obj.via.map.ptr[i].val;
        if (key.as<std::string>() == "vertices") {
            for (size_t j = 0; j < val.via.array.size; j += 3) {
                Vertex v;
                v.x = val.via.array.ptr[j].as<float>();
                v.y = val.via.array.ptr[j + 1].as<float>();
                v.z = val.via.array.ptr[j + 2].as<float>();
                extractedData.vertices.push_back(v);
            }
        } else if (key.as<std::string>() == "triangles") {
            for (size_t j = 0; j < val.via.array.size; j += 3) {
                Triangle t;
                t.v1 = val.via.array.ptr[j].as<uint32_t>();
                t.v2 = val.via.array.ptr[j + 1].as<uint32_t>();
                t.v3 = val.via.array.ptr[j + 2].as<uint32_t>();
                extractedData.triangles.push_back(t);
            }
        }
    }
    return extractedData;
}
