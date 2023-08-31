#include "NavmeshBuildSystem.h"
#include "Engine/Entities/EntitySeriesTaskRunners.hpp"
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "Engine/Navigation/BuiltNavMesh.h"
#include "Engine/Rendering/ModelLoader.h"
#include "NavigatableMesh.h"
#include <recastnavigation/Recast.h>

static NavmeshBuildSystem instance;

NavmeshBuildSystem::NavmeshBuildSystem() {
    // Initialization logic (if any) goes here.
    meshUnbuilt = false;
}

void BuildEntity(double Dt, EntityData* ent) {
    NavigatableMesh* nm = EntityComponentSystem::GetComponent<NavigatableMesh>(ent);
    const auto extractedData = ModelLoader::getInstance().GetMeshFromFile(nm->AwsPath, nm->MeshName, 0);

    if (!extractedData) {
        NavmeshBuildSystem::getInstance().meshUnbuilt = true;
        return;
    }

    nm->extractedModelData = extractedData;

    EntityComponentSystem::AddSetComponentToEntity(ent, new BuiltNavigatableMesh(), false, false);
}

ExtractedModelData GetModelFromDetailedMesh(const rcPolyMeshDetail& dmesh) {
    ExtractedModelData extractedData;
    for (int i = 0; i < dmesh.nverts; i++) {
        Vertex vertex = {dmesh.verts[i * 3], dmesh.verts[i * 3 + 1], dmesh.verts[i * 3 + 2]};
        extractedData.vertices.push_back(vertex);
    }

    for (int i = 0; i < dmesh.nmeshes; i++) {
        const int base = dmesh.meshes[i * 4];
        const int end = base + dmesh.meshes[i * 4 + 1];
        for (int j = base; j < end; j++) {
            Triangle triangle = {(uint32_t)dmesh.tris[j * 4], (uint32_t)dmesh.tris[j * 4 + 1], (uint32_t)dmesh.tris[j * 4 + 2]};
            extractedData.triangles.push_back(triangle);
        }
    }

    return extractedData;
}

ExtractedModelData GetModelFromHeightfield(const rcHeightfield& hf, const rcConfig& config) {
    ExtractedModelData data;

    // For each cell in the grid
    for (int y = 0; y < hf.height; ++y) {
        for (int x = 0; x < hf.width; ++x) {
            for (rcSpan* s = hf.spans[x + y * hf.width]; s; s = s->next) {
                float baseX = config.bmin[0] + x * config.cs;
                float baseY = config.bmin[1] + s->smin * config.ch;
                float baseZ = config.bmin[2] + y * config.cs;

                // Create 4 vertices for top face of the voxel
                Vertex v1 = { baseX, baseY, baseZ };
                Vertex v2 = { baseX + config.cs, baseY, baseZ };
                Vertex v3 = { baseX + config.cs, baseY, baseZ + config.cs };
                Vertex v4 = { baseX, baseY, baseZ + config.cs };

                // Add vertices to the data
                uint32_t baseIndex = data.vertices.size();
                data.vertices.push_back(v1);
                data.vertices.push_back(v2);
                data.vertices.push_back(v3);
                data.vertices.push_back(v4);

                // Create 2 triangles for the quad
                Triangle t1 = { baseIndex, baseIndex + 1, baseIndex + 2 };
                Triangle t2 = { baseIndex, baseIndex + 2, baseIndex + 3 };

                // Add triangles to the data
                data.triangles.push_back(t1);
                data.triangles.push_back(t2);
            }
        }
    }
    data.ensureTrianglesUpwards();
    
    return data;
}

void printNumCells(rcCompactHeightfield& chf, std::string prefix) {
    int walkableCells = 0;
    for (int i = 0; i < chf.spanCount; ++i) {
        if (chf.areas[i] != RC_NULL_AREA) {
            walkableCells++;
        }
    }
    std::cout << prefix << walkableCells << std::endl;
}

void NavmeshBuildSystem::RunSystem(bool Init, double dt) {
    NavmeshBuildSystem::getInstance().meshUnbuilt = false;
    const auto unbuiltEnts = EntityComponentSystem::GetEntitiesWithData({typeid(NavigatableMesh)}, {typeid(BuiltNavigatableMesh)});
    EntityTaskRunners::AutoPerformTasksParallel("BuildNavmesh", unbuiltEnts, BuildEntity, dt);

    if (unbuiltEnts.get()->size() > 0 && NavmeshBuildSystem::getInstance().meshUnbuilt == false) {
        NavmeshBuildSystem::getInstance().PerformNavmeshRebuild();
    }
}

void NavmeshBuildSystem::PerformNavmeshRebuild() {
    const auto allEnts = EntityComponentSystem::GetEntitiesWithData({typeid(NavigatableMesh)}, {});

    std::cout << "Meshes into Navmesh: " << allEnts.get()->size() << std::endl;

    //Rebuild navmesh
    std::vector<float> verts;
    std::vector<int> tris;

    EntityTaskRunners::AutoPerformTasksSeries(
        "rasteriseHeightfield", allEnts,
        [&](double Dt, EntityData* ent) {
            NavigatableMesh* nm = EntityComponentSystem::GetComponent<NavigatableMesh>(ent);
            const auto extractedData = nm->extractedModelData;
            if (!nm->extractedModelData) {
                return;
            }
            for (const auto& tri : extractedData->triangles) {
                // Vertex 1
                verts.push_back(extractedData->vertices[tri.v1].x);
                verts.push_back(extractedData->vertices[tri.v1].y);
                verts.push_back(extractedData->vertices[tri.v1].z);

                // Vertex 2
                verts.push_back(extractedData->vertices[tri.v2].x);
                verts.push_back(extractedData->vertices[tri.v2].y);
                verts.push_back(extractedData->vertices[tri.v2].z);

                // Vertex 3
                verts.push_back(extractedData->vertices[tri.v3].x);
                verts.push_back(extractedData->vertices[tri.v3].y);
                verts.push_back(extractedData->vertices[tri.v3].z);
            }

            for (size_t i = 0; i < extractedData->triangles.size(); ++i) {
                tris.push_back(i * 3);
                tris.push_back(i * 3 + 1);
                tris.push_back(i * 3 + 2);
            }
        },
        0);

    const float BOUNDS_MAX = 10;
    //Get min and max bounds of navmesh area
    float bmin[3] = {BOUNDS_MAX, BOUNDS_MAX, BOUNDS_MAX};
    float bmax[3] = {-BOUNDS_MAX, -BOUNDS_MAX, -BOUNDS_MAX};
    for (int i = 0; i < verts.size(); i += 3) {
        for (int j = 0; j < 3; j++) {
            bmin[j] = std::min(bmin[j], verts[i + j]);
            bmax[j] = std::max(bmax[j], verts[i + j]);
        }
    }

    rcConfig config;
    memset(&config, 0, sizeof(config));
    //Setup config for building
    for (int i = 0; i < 3; i++) {
        config.bmin[i] = bmin[i];
        config.bmax[i] = bmax[i];
    }
    config.cs = 3.0f;
    config.ch = 1.0f;
    config.width = (int)((config.bmax[0] - config.bmin[0]) / config.cs + 0.5f);
    config.height = (int)((config.bmax[2] - config.bmin[2]) / config.cs + 0.5f);
    config.walkableSlopeAngle = 45.0f;
    config.walkableHeight = (int)(2.0f / config.ch + 0.99f);
    config.walkableClimb = (int)(0.9f / config.ch);
    config.walkableRadius = (int)(0.5f / config.cs + 0.99f);
    config.maxEdgeLen = 12;
    config.maxSimplificationError = 1.3f;
    config.minRegionArea = 50;
    config.mergeRegionArea = 20;
    config.maxVertsPerPoly = 6;
    config.detailSampleDist = 6.0f * config.cs;
    config.detailSampleMaxError = 1.0f;

    // Create a heightfield
    rcHeightfield hf;
    rcContext context(false);
    if (!rcCreateHeightfield(&context, hf, config.width, config.height, &config.bmin[0], &config.bmax[0], config.cs, config.ch)) {
        std::cerr << "Can't create heightfield for context " << std::endl;
    }

    // Assume all triangles are walkable for now
    std::vector<unsigned char> triAreas(tris.size(), RC_WALKABLE_AREA);

    std::cout << "Verts into navmesh: " << verts.size() << std::endl;

    rcRasterizeTriangles(&context, &verts[0], verts.size() / 3, &tris[0], &triAreas[0], tris.size() / 3, hf, config.walkableClimb);
    int spanCount = 0;
    for (int y = 0; y < hf.height; ++y) {
        for (int x = 0; x < hf.width; ++x) {
            for (rcSpan* s = hf.spans[x + y * hf.width]; s; s = s->next) {
                spanCount++;
            }
        }
    }
    std::cout << "Spans after rasterizing: " << spanCount << std::endl;

    if (NavmeshBuildSystem::getInstance().onHeightfieldRebuild.HasListeners()) { 
        NavmeshBuildSystem::getInstance().onHeightfieldRebuild.triggerEvent(GetModelFromHeightfield(hf,config));
    }

    //Filter out items that are too low to walk on
    rcFilterWalkableLowHeightSpans(&context, 200, hf);
    //Compact heightfield to save geom
    rcCompactHeightfield chf;
    if (!rcBuildCompactHeightfield(&context, config.walkableHeight, config.walkableClimb, hf, chf)) {
        std::cerr << "Issue compacting heightfield for navmesh" << std::endl;
    }
    printNumCells(chf, "Walkable cells after compacting: ");

    // if (!rcErodeWalkableArea(&context, config.walkableRadius, chf)) {
    //     std::cerr << "Issue eroding for navmesh" << std::endl;
    // }
    // printNumCells(chf, "Walkable cells after eroding: ");

    if (!rcBuildDistanceField(&context, chf)) {
        std::cerr << "Issue building distance fields navmesh" << std::endl;
    }
    printNumCells(chf, "Walkable cells after distance field: ");

    if (!rcBuildRegions(&context, chf, 0, config.minRegionArea, config.mergeRegionArea)) {
        std::cerr << "Issue building regions navmesh" << std::endl;
    }
    printNumCells(chf, "Walkable cells after regions: ");

    rcContourSet cset;
    if (!rcBuildContours(&context, chf, config.maxSimplificationError, config.maxEdgeLen, cset)) {
        std::cerr << "Issue building contours navmesh" << std::endl;
    }
    std::cout << "Number of contours: " << cset.nconts << std::endl;

    rcPolyMesh pmesh;
    if (!rcBuildPolyMesh(&context, cset, config.maxVertsPerPoly, pmesh)) {
        std::cerr << "Issue building poly navmesh" << std::endl;
    }
    std::cout << "Low Detail Navmesh Number of polygons: " << pmesh.npolys << std::endl;

    rcPolyMeshDetail dmesh;
    if (!rcBuildPolyMeshDetail(&context, pmesh, chf, config.detailSampleDist, config.detailSampleMaxError, dmesh)) {
        std::cerr << "Issue building detail poly navmesh" << std::endl;
    }

    if (NavmeshBuildSystem::getInstance().onNavmeshRebuild.HasListeners()) {
        // ExtractedModelData testMesh;
        // EntityTaskRunners::AutoPerformTasksSeries("testHeight",allEnts,
        //     [&](double Dt, EntityData* ent) {
        //         NavigatableMesh* nm = EntityComponentSystem::GetComponent<NavigatableMesh>(ent);
        //         const auto extractedData = nm->extractedModelData;
        //         testMesh.triangles.insert(testMesh.triangles.end(),extractedData->triangles.begin(),extractedData->triangles.end());
        //         testMesh.vertices.insert(testMesh.vertices.end(),extractedData->vertices.begin(),extractedData->vertices.end());
        // },0);
        //NavmeshBuildSystem::getInstance().onNavmeshRebuild.triggerEvent(testMesh);
        NavmeshBuildSystem::getInstance().onNavmeshRebuild.triggerEvent(GetModelFromDetailedMesh(dmesh));
    }

    std::cout << "Navmesh Generated" << std::endl;
}
