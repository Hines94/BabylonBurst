#include "ExtractedMeshData.h"
#include <iostream>

Vertex Vertex::crossProduct(const Vertex& a, const Vertex& b) {
    Vertex result;
    result.x = a.y * b.z - a.z * b.y;
    result.y = a.z * b.x - a.x * b.z;
    result.z = a.x * b.y - a.y * b.x;
    return result;
}

Vertex Vertex::subtract(const Vertex& a, const Vertex& b) {
    Vertex result;
    result.x = a.x - b.x;
    result.y = a.y - b.y;
    result.z = a.z - b.z;
    return result;
}

void Triangle::flipTriangleOrientation() {
    std::swap(v1, v2);
}

//Useful for easier visualistaion
void ExtractedModelData::ensureTrianglesUpwards() {
    for (Triangle& tri : triangles) {
        Vertex v1 = vertices[tri.v1];
        Vertex v2 = vertices[tri.v2];
        Vertex v3 = vertices[tri.v3];

        Vertex edge1 = Vertex::subtract(v2, v1);
        Vertex edge2 = Vertex::subtract(v3, v1);

        Vertex normal = Vertex::crossProduct(edge1, edge2);

        if (normal.y < 0) {
            tri.flipTriangleOrientation();
        }
    }
}