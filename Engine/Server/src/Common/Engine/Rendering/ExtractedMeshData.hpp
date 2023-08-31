#pragma once
#include <vector>
#include <cstdint>

struct Vertex {
    float x, y, z;
};

struct Triangle {
    uint32_t v1, v2, v3;  
};

struct ExtractedModelData {
    std::vector<Vertex> vertices;
    std::vector<Triangle> triangles;
};