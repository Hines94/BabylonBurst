#include "NavmeshBuildSystem.h"
#include "Engine/Entities/EntitySeriesTaskRunners.hpp"
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "Engine/Navigation/BuiltNavMesh.h"
#include "Engine/Navigation/NavmeshBuildSettings.h"
#include "Engine/Rendering/ModelLoader.h"
#include "NavigatableMesh.h"
#include "NavmeshBuildSystemDebugMethods.cpp"
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

void NavmeshBuildSystem::RunSystem(bool Init, double dt) {
    NavmeshBuildSystem::getInstance().meshUnbuilt = false;
    const auto unbuiltEnts = EntityComponentSystem::GetEntitiesWithData({typeid(NavigatableMesh)}, {typeid(BuiltNavigatableMesh)});
    EntityTaskRunners::AutoPerformTasksParallel("BuildNavmesh", unbuiltEnts, BuildEntity, dt);

    //Different geom require rebuild?
    if (unbuiltEnts.get()->size() > 0 && NavmeshBuildSystem::getInstance().meshUnbuilt == false) {
        NavmeshBuildSystem::getInstance().PerformNavmeshRebuild();
    } else {
        const auto settings = EntityComponentSystem::GetEntitiesWithData({typeid(NavmeshBuildSettings)}, {});
        //Request rebuild from settings?
        if (settings.get()->size() > 0 && unbuiltEnts.get()->size() == 0) {
            const auto firstNavSettings = EntityComponentSystem::GetComponent<NavmeshBuildSettings>(settings.get()->GetLimitedNumber(1)[0]);
            if (firstNavSettings->performRebuild) {
                firstNavSettings->performRebuild = false;
                NavmeshBuildSystem::getInstance().PerformNavmeshRebuild();
            }
        }
    }
}

void NavmeshBuildSystem::PerformNavmeshRebuild() {
    const auto allEnts = EntityComponentSystem::GetEntitiesWithData({typeid(NavigatableMesh)}, {});
    const auto settings = EntityComponentSystem::GetEntitiesWithData({typeid(NavmeshBuildSettings)}, {});

    NavmeshBuildSettings* buildSettings = nullptr;
    if (settings.get()->size() > 0) {
        buildSettings = EntityComponentSystem::GetComponent<NavmeshBuildSettings>(settings.get()->GetLimitedNumber(1)[0]);
    }

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
                std::cerr << "Null extracted data" << std::endl;
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

    float bmin[3] = {std::numeric_limits<float>::max(), std::numeric_limits<float>::max(), std::numeric_limits<float>::max()};
    float bmax[3] = {std::numeric_limits<float>::lowest(), std::numeric_limits<float>::lowest(), std::numeric_limits<float>::lowest()};
    for (int i = 0; i < verts.size(); i += 3) {
        for (int j = 0; j < 3; j++) {
            bmin[j] = std::min(bmin[j], verts[i + j]);
            bmax[j] = std::max(bmax[j], verts[i + j]);
        }
    }
    std::cout << "Min: " << bmin[0] << " " << bmin[1] << " " << bmin[2] << std::endl;
    std::cout << "Max: " << bmax[0] << " " << bmax[1] << " " << bmax[2] << std::endl;

    if (NavmeshBuildSystem::getInstance().onNavmeshStageRebuild.HasListeners()) {
        ExtractedModelData geomIn;
        for (int i = 0; i < verts.size(); i += 3) {
            Vertex newVert;
            newVert.x = verts[i];
            newVert.y = verts[i + 1];
            newVert.z = verts[i + 2];
            geomIn.vertices.push_back(newVert);
        }
        for (int i = 0; i < tris.size(); i += 3) {
            Triangle newTri;
            newTri.v1 = tris[i];
            newTri.v2 = tris[i + 1];
            newTri.v3 = tris[i + 2];
            geomIn.triangles.push_back(newTri);
        }
        NavmeshBuildSystem::getInstance().onNavmeshStageRebuild.triggerEvent(geomIn, "Nav Geom In");
    }

    rcConfig config;
    memset(&config, 0, sizeof(config));
    //Setup config for building
    for (int i = 0; i < 3; i++) {
        config.bmin[i] = bmin[i];
        config.bmax[i] = bmax[i];
    }
    config.cs = 0.2f; // Equal to radius of avg human / 2
    config.ch = config.cs / 2;
    config.width = (int)((config.bmax[0] - config.bmin[0]) / config.cs + 0.5f);
    config.height = (int)((config.bmax[2] - config.bmin[2]) / config.cs + 0.5f);
    config.walkableSlopeAngle = 45.0f;
    config.walkableHeight = (int)(2.0f / config.ch + 0.99f);
    config.walkableClimb = (int)(0.3f / config.ch);
    config.walkableRadius = (int)(0.5f / config.cs + 0.99f);
    config.maxEdgeLen = 12;
    config.maxSimplificationError = 1.3f;
    config.minRegionArea = 500;
    config.mergeRegionArea = 200;
    config.maxVertsPerPoly = 6;
    config.detailSampleDist = 6.0f;
    config.detailSampleMaxError = 1.0f;

    if (buildSettings != nullptr) {
        config.cs = buildSettings->CellSize;
        config.ch = buildSettings->CellHeight;
        config.walkableSlopeAngle = buildSettings->WalkableSlopeHeight;
        config.walkableClimb = buildSettings->WalkableClimb;
        config.walkableHeight = buildSettings->WalkableHeight;
        config.minRegionArea = buildSettings->MinRegionArea;
        config.mergeRegionArea = buildSettings->MergeRegionArea;
    }

    // Create a heightfield
    rcHeightfield hf;
    rcContext context(false);
    if (!rcCreateHeightfield(&context, hf, config.width, config.height, &config.bmin[0], &config.bmax[0], config.cs, config.ch)) {
        std::cerr << "Can't create heightfield for context " << std::endl;
    }
    std::cout << "Verts into navmesh: " << verts.size() << std::endl;

    // Assume all triangles are walkable for now
    std::vector<unsigned char> triAreas(tris.size(), RC_WALKABLE_AREA);
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

    if (NavmeshBuildSystem::getInstance().onNavmeshStageRebuild.HasListeners()) {
        NavmeshBuildSystem::getInstance().onNavmeshStageRebuild.triggerEvent(NavmeshDebugMethods::GetModelFromHeightfield(hf, config), "Nav Heightfield");
    }

    //Filter out items that are too low to walk on
    rcFilterWalkableLowHeightSpans(&context, 200, hf);
    //Compact heightfield to save geom
    rcCompactHeightfield chf;
    if (!rcBuildCompactHeightfield(&context, config.walkableHeight, config.walkableClimb, hf, chf)) {
        std::cerr << "Issue compacting heightfield for navmesh" << std::endl;
    }
    NavmeshDebugMethods::printNumCells(chf, "Walkable cells after compacting: ");

    if (chf.spanCount == 0 || !rcErodeWalkableArea(&context, config.walkableRadius, chf)) {
        std::cerr << "Issue eroding for navmesh" << std::endl;
    }
    NavmeshDebugMethods::printNumCells(chf, "Walkable cells after eroding: ");

    if (chf.spanCount == 0 || !rcBuildDistanceField(&context, chf)) {
        std::cerr << "Issue building distance fields navmesh" << std::endl;
    }
    NavmeshDebugMethods::printNumCells(chf, "Walkable cells after distance field: ");

    if (chf.spanCount == 0 || !rcBuildRegions(&context, chf, 0, config.minRegionArea, config.mergeRegionArea)) {
        std::cerr << "Issue building regions navmesh" << std::endl;
    }
    if (NavmeshBuildSystem::getInstance().onNavmeshRegionsRebuild.HasListeners()) {
        NavmeshBuildSystem::getInstance().onNavmeshRegionsRebuild.triggerEvent(NavmeshDebugMethods::ExtractMeshDataFromCompactHeightfieldRegions(chf));
    }
    NavmeshDebugMethods::printNumCells(chf, "Walkable cells after regions: ");

    rcContourSet cset;
    if (!rcBuildContours(&context, chf, config.maxSimplificationError, config.maxEdgeLen, cset)) {
        std::cerr << "Issue building contours navmesh" << std::endl;
    }
    std::cout << "Number of contours: " << cset.nconts << std::endl;

    if (onNavmeshContoursRebuild.HasListeners()) {
        onNavmeshContoursRebuild.triggerEvent(NavmeshDebugMethods::GetLinesFromContours(&cset));
    }

    rcPolyMesh pmesh;
    if (!rcBuildPolyMesh(&context, cset, config.maxVertsPerPoly, pmesh)) {
        std::cerr << "Issue building poly navmesh" << std::endl;
    }
    if (NavmeshBuildSystem::getInstance().onNavmeshStageRebuild.HasListeners()) {
        NavmeshBuildSystem::getInstance().onNavmeshStageRebuild.triggerEvent(NavmeshDebugMethods::GetModelFromLowPolyMesh(pmesh), "LowPoly NavMesh");
    }
    std::cout << "Low Detail Navmesh Number of polygons: " << pmesh.npolys << std::endl;

    rcPolyMeshDetail dmesh;
    if (!rcBuildPolyMeshDetail(&context, pmesh, chf, config.detailSampleDist, config.detailSampleMaxError, dmesh)) {
        std::cerr << "Issue building detail poly navmesh" << std::endl;
    }
    // if (NavmeshBuildSystem::getInstance().onNavmeshStageRebuild.HasListeners()) {
    //     NavmeshBuildSystem::getInstance().onNavmeshStageRebuild.triggerEvent(NavmeshDebugMethods::GetModelFromDetailedMesh(dmesh), "NavMesh");
    // }

    std::cout << "Navmesh Generated" << std::endl;
}
