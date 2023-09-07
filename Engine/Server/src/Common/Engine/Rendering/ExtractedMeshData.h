#pragma once
#include <cstdint>
#include <vector>

struct Vertex {
    float x, y, z;

    static Vertex crossProduct(const Vertex& a, const Vertex& b);
    static Vertex subtract(const Vertex& a, const Vertex& b);
};

struct Triangle {
    uint32_t v1, v2, v3;

    void flipTriangleOrientation();
};

//Elements extracted from a mesh for easy diagnosis/feeding into nav etc
struct ExtractedModelData {
    std::vector<Vertex> vertices;
    std::vector<Triangle> triangles;

    //Useful for navmesh - Can get wrong orientation from heightfield (no problem)
    void ensureTrianglesUpwards();
};

//Specifier for a line segment. Useful for visualing data
struct LineSegment {
    float startX, startY, startZ;
    float endX, endY, endZ;
};
