#include "Engine/Rendering/ExtractedMeshData.h"
#include <iostream>
#include <recastnavigation/Recast.h>
#include <unordered_map>

namespace NavmeshDebugMethods {
    inline ExtractedModelData GetModelFromDetailedMesh(const rcPolyMeshDetail& dmesh) {
        // ExtractedModelData extractedData;
        // extractedData.vertices.reserve(dmesh.nverts);
        // for (int i = 0; i < dmesh.nverts; i++) {
        //     Vertex vertex = {dmesh.verts[i * 3], dmesh.verts[i * 3 + 1], dmesh.verts[i * 3 + 2]};
        //     extractedData.vertices.push_back(vertex);
        // }

        // for (int i = 0; i < dmesh.nmeshes; i++) {
        //     const int base = dmesh.meshes[i * 4];
        //     const int end = base + dmesh.meshes[i * 4 + 1];
        //     for (int j = base; j < end; j++) {
        //         Triangle triangle = {(uint32_t)dmesh.tris[j * 4], (uint32_t)dmesh.tris[j * 4 + 1], (uint32_t)dmesh.tris[j * 4 + 2]};
        //         extractedData.triangles.push_back(triangle);
        //     }
        // }

        // return extractedData;
        //TODO: Fix this if needed?
    }

    inline ExtractedModelData GetModelFromLowPolyMesh(const rcPolyMesh& mesh) {
        ExtractedModelData extractedData;

        // Extract vertices with correct scaling and positioning
        extractedData.vertices.reserve(mesh.nverts);
        for (int i = 0; i < mesh.nverts; i++) {
            const unsigned short* v = &mesh.verts[i * 3];
            Vertex vertex = {
                mesh.bmin[0] + v[0] * mesh.cs,
                mesh.bmin[1] + (v[1] + 1) * mesh.ch,  // Note the +1 offset
                mesh.bmin[2] + v[2] * mesh.cs
            };
            extractedData.vertices.push_back(vertex);
        }

        // Extract triangles
        const int nvp = mesh.nvp;
        for (int i = 0; i < mesh.npolys; ++i) {
            const unsigned short* p = &mesh.polys[i * nvp * 2];
            
            // Triangulate the polygon
            for (int j = 2; j < nvp; ++j) {
                if (p[j] == RC_MESH_NULL_IDX) break;
                Triangle triangle = {
                    p[0],
                    p[j - 1],
                    p[j]
                };
                extractedData.triangles.push_back(triangle);
            }
        }

        return extractedData;
    }

    inline std::vector<ExtractedModelData> ExtractMeshDataFromCompactHeightfieldRegions(const rcCompactHeightfield& chf) {
        std::unordered_map<int, ExtractedModelData> regionToMeshDataMap;
        const float cs = chf.cs;
        const float ch = chf.ch;

        for (int y = 0; y < chf.height; ++y) {
            for (int x = 0; x < chf.width; ++x) {
                const float fx = chf.bmin[0] + x * cs;
                const float fz = chf.bmin[2] + y * cs;
                const rcCompactCell& c = chf.cells[x + y * chf.width];

                for (unsigned i = c.index, ni = c.index + c.count; i < ni; ++i) {
                    const rcCompactSpan& s = chf.spans[i];
                    const float fy = chf.bmin[1] + (s.y) * ch;

                    if (s.reg) {
                        Vertex v1 = {fx, fy, fz};
                        Vertex v2 = {fx, fy, fz + cs};
                        Vertex v3 = {fx + cs, fy, fz + cs};
                        Vertex v4 = {fx + cs, fy, fz};

                        // Check if region exists in map, if not, create an entry
                        if (regionToMeshDataMap.find(s.reg) == regionToMeshDataMap.end()) {
                            regionToMeshDataMap[s.reg] = ExtractedModelData();
                        }

                        size_t vertexBase = regionToMeshDataMap[s.reg].vertices.size();

                        regionToMeshDataMap[s.reg].vertices.push_back(v1);
                        regionToMeshDataMap[s.reg].vertices.push_back(v2);
                        regionToMeshDataMap[s.reg].vertices.push_back(v3);
                        regionToMeshDataMap[s.reg].vertices.push_back(v4);

                        Triangle t1 = {static_cast<uint32_t>(vertexBase), static_cast<uint32_t>(vertexBase + 1), static_cast<uint32_t>(vertexBase + 2)};
                        Triangle t2 = {static_cast<uint32_t>(vertexBase), static_cast<uint32_t>(vertexBase + 2), static_cast<uint32_t>(vertexBase + 3)};

                        regionToMeshDataMap[s.reg].triangles.push_back(t1);
                        regionToMeshDataMap[s.reg].triangles.push_back(t2);
                    }
                }
            }
        }

        std::vector<ExtractedModelData> meshDataList;
        for (auto& pair : regionToMeshDataMap) {
            meshDataList.push_back(pair.second);
        }

        return meshDataList;
    }

    inline ExtractedModelData GetModelFromHeightfield(const rcHeightfield& hf, const rcConfig& config) {
        ExtractedModelData data;

        // For each cell in the grid
        for (int y = 0; y < hf.height; ++y) {
            for (int x = 0; x < hf.width; ++x) {
                for (rcSpan* s = hf.spans[x + y * hf.width]; s; s = s->next) {
                    float baseX = config.bmin[0] + x * config.cs;
                    float baseY = config.bmin[1] + s->smin * config.ch;
                    float baseZ = config.bmin[2] + y * config.cs;

                    // Create 4 vertices for top face of the voxel
                    Vertex v1 = {baseX, baseY, baseZ};
                    Vertex v2 = {baseX + config.cs, baseY, baseZ};
                    Vertex v3 = {baseX + config.cs, baseY, baseZ + config.cs};
                    Vertex v4 = {baseX, baseY, baseZ + config.cs};

                    // Add vertices to the data
                    uint32_t baseIndex = data.vertices.size();
                    data.vertices.push_back(v1);
                    data.vertices.push_back(v2);
                    data.vertices.push_back(v3);
                    data.vertices.push_back(v4);

                    // Create 2 triangles for the quad
                    Triangle t1 = {baseIndex, baseIndex + 1, baseIndex + 2};
                    Triangle t2 = {baseIndex, baseIndex + 2, baseIndex + 3};

                    // Add triangles to the data
                    data.triangles.push_back(t1);
                    data.triangles.push_back(t2);
                }
            }
        }
        data.ensureTrianglesUpwards();

        return data;
    }

    inline void printNumCells(rcCompactHeightfield& chf, std::string prefix) {
        int walkableCells = 0;
        for (int i = 0; i < chf.spanCount; ++i) {
            if (chf.areas[i] != RC_NULL_AREA) {
                walkableCells++;
            }
        }
        std::cout << prefix << walkableCells << std::endl;
    }

    inline std::vector<LineSegment> GetLinesFromContours(const rcContourSet* cset) {
        std::vector<LineSegment> lines;

        if (!cset) {
            std::cerr << "cset is nullptr!" << std::endl;
            return lines;
        }

        const float* orig = cset->bmin;
        const float cs = cset->cs;
        const float ch = cset->ch;

        for (int i = 0; i < cset->nconts; ++i) {
            const rcContour& contour = cset->conts[i];

            if (contour.nverts < 2) {
                std::cerr << "Contour " << i << " has less than 2 vertices." << std::endl;
                continue;
            }

            if (!contour.verts) {
                std::cerr << "Invalid vertices for contour " << i << std::endl;
                continue;
            }

            for (int j = 0, k = contour.nverts - 1; j < contour.nverts; k = j++) {
                const int* va = &contour.verts[k * 4];
                const int* vb = &contour.verts[j * 4];

                LineSegment segment;

                segment.startX = orig[0] + va[0] * cs;
                segment.startY = orig[1] + (va[1] + 1 + (i & 1)) * ch;
                segment.startZ = orig[2] + va[2] * cs;

                segment.endX = orig[0] + vb[0] * cs;
                segment.endY = orig[1] + (vb[1] + 1 + (i & 1)) * ch;
                segment.endZ = orig[2] + vb[2] * cs;

                lines.push_back(segment);
            }
        }

        return lines;
    }
} // namespace NavmeshDebugMethods