#include "NavmeshBuildSystem.h"
#include "Engine/Entities/EntitySeriesTaskRunners.hpp"
#include "Engine/Entities/EntitySystem.h"
#include "Engine/Entities/EntityTaskRunners.hpp"
#include "Engine/Navigation/LoadedNavmeshData.h"
#include "Engine/Navigation/LoadedNavmeshSurface.h"
#include "Engine/Navigation/NavigatableEntitySurface.h"
#include "Engine/Navigation/NavmeshBuildSetup.h"
#include "Engine/Rendering/ModelLoader.h"
#include "Engine/Utils/VisualMessageShower.h"
#include "NavmeshBuildSystemDebugMethods.cpp"
#include <algorithm>
#include <recastnavigation/DetourNavMesh.h>
#include <recastnavigation/DetourNavMeshBuilder.h>
#include <recastnavigation/Recast.h>

//Utils

static NavmeshBuildSystem instance;

std::vector<CachedNavElement> ExtractCachedData(std::vector<NavigatableEntitySurface*> surfaces) {
    std::vector<CachedNavElement> ret;
    for (const auto& surf : surfaces) {
        CachedNavElement ele;
        ele.AwsPath = surf->AwsPath;
        ele.MeshName = surf->MeshName;
        ret.push_back(ele);
    }
    return ret;
}

bool compareByMeshName(const NavigatableEntitySurface* a, const NavigatableEntitySurface* b) {
    return a->MeshName < b->MeshName;
}

//Methods

NavmeshBuildSystem::NavmeshBuildSystem() {
    // Initialization logic (if any) goes here.
    meshUnbuilt = false;
}

void BuildEntity(double Dt, EntityData* ent) {
    NavigatableEntitySurface* nm = EntityComponentSystem::GetComponent<NavigatableEntitySurface>(ent);
    const auto extractedData = ModelLoader::getInstance().GetMeshFromFile(nm->AwsPath, nm->MeshName, 0);

    if (!extractedData) {
        NavmeshBuildSystem::getInstance().meshUnbuilt = true;
        return;
    }

    nm->extractedModelData = extractedData;

    EntityComponentSystem::AddSetComponentToEntity(ent, new LoadedNavmeshSurface(), false, false);
}

void NavmeshBuildSystem::RunSystem(bool Init, double dt) {
    NavmeshBuildSystem::getInstance().meshUnbuilt = false;
    const auto unbuiltEnts = EntityComponentSystem::GetEntitiesWithData({typeid(NavigatableEntitySurface)}, {typeid(LoadedNavmeshSurface)});
    EntityTaskRunners::AutoPerformTasksParallel("BuildNavmesh", unbuiltEnts, BuildEntity, dt);

    //Different geom require rebuild?
    if (unbuiltEnts.get()->size() > 0 && NavmeshBuildSystem::getInstance().meshUnbuilt == false) {
        if (!IsNavmeshLatest()) {
            NavmeshBuildSystem::getInstance().PerformNavmeshRebuild();
        } else {
            std::cout << "Using cached navmesh data!" << std::endl;
        }
    } else {
        const auto settings = EntityComponentSystem::GetSingleton<NavmeshBuildSetup>();
        //Request rebuild from settings?
        if (settings && unbuiltEnts.get()->size() == 0) {
            if (settings->performRebuild) {
                settings->performRebuild = false;
                NavmeshBuildSystem::getInstance().PerformNavmeshRebuild();
            }
        }
    }
}

void NavmeshBuildSystem::PerformNavmeshRebuild() {
    const auto allEnts = EntityComponentSystem::GetEntitiesWithData({typeid(NavigatableEntitySurface)}, {});
    NavmeshBuildSetup* buildSettings = EntityComponentSystem::GetSingleton<NavmeshBuildSetup>();

    std::cout << "Meshes into Navmesh: " << allEnts.get()->size() << std::endl;

    //Rebuild navmesh
    std::vector<float> verts;
    std::vector<int> tris;

    //Get data in
    std::vector<NavigatableEntitySurface*> orderedSurfaces = allEnts->GetAllComponents<NavigatableEntitySurface>();
    std::sort(orderedSurfaces.begin(), orderedSurfaces.end(), compareByMeshName);

    //Set verts and tris
    std::vector<unsigned char> triAreas;
    for (const auto& nm : orderedSurfaces) {
        const auto extractedData = nm->extractedModelData;
        if (!nm->extractedModelData) {
            std::cerr << "Null extracted data" << std::endl;
            return;
        }
        //TODO: user specified areas
        triAreas.insert(triAreas.end(), extractedData->triangles.size(), RC_WALKABLE_AREA);
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
    }

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
        std::cout << "Navmesh built with existing settings. CS: " << buildSettings->CellSize << std::endl;
    }

    // Create a heightfield
    rcHeightfield hf;
    rcContext context(false);
    if (!rcCreateHeightfield(&context, hf, config.width, config.height, &config.bmin[0], &config.bmax[0], config.cs, config.ch)) {
        std::cerr << "Can't create heightfield for context " << std::endl;
    }
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

    //Convert high poly mesh into actual navmesh data
    unsigned char* navData = 0;
    int navDataSize = 0;
    dtNavMeshCreateParams params;
    memset(&params, 0, sizeof(params));
    params.verts = pmesh.verts;
    params.vertCount = pmesh.nverts;
    params.polys = pmesh.polys;
    params.polyAreas = pmesh.areas;
    params.polyFlags = pmesh.flags;
    params.polyCount = pmesh.npolys;
    params.nvp = pmesh.nvp;
    params.detailMeshes = dmesh.meshes;
    params.detailVerts = dmesh.verts;
    params.detailVertsCount = dmesh.nverts;
    params.detailTris = dmesh.tris;
    params.detailTriCount = dmesh.ntris;
    // params.offMeshConVerts = m_geom->getOffMeshConnectionVerts(); TODO: Revisit these https://github.com/recastnavigation/recastnavigation/blob/main/RecastDemo/Source/Sample_SoloMesh.cpp
    // params.offMeshConRad = m_geom->getOffMeshConnectionRads();
    // params.offMeshConDir = m_geom->getOffMeshConnectionDirs();
    // params.offMeshConAreas = m_geom->getOffMeshConnectionAreas();
    // params.offMeshConFlags = m_geom->getOffMeshConnectionFlags();
    // params.offMeshConUserID = m_geom->getOffMeshConnectionId();
    // params.offMeshConCount = m_geom->getOffMeshConnectionCount();
    params.walkableHeight = config.walkableHeight;
    params.walkableRadius = config.walkableRadius;
    params.walkableClimb = config.walkableClimb;
    rcVcopy(params.bmin, pmesh.bmin);
    rcVcopy(params.bmax, pmesh.bmax);
    params.cs = config.cs;
    params.ch = config.ch;
    params.buildBvTree = true;

    if (!dtCreateNavMeshData(&params, &navData, &navDataSize)) {
        std::cerr << "Could not build Detour navmesh" << std::endl;
    }

    //Set data saved for later
    LoadedNavmeshData* load = EntityComponentSystem::GetOrCreateSingleton<LoadedNavmeshData>();
    load->navmeshData = std::string(reinterpret_cast<char*>(navData), navDataSize);
    load->savedSetup = ExtractCachedData(orderedSurfaces);
    std::cout << "Set load data: " << load->savedSetup.size();
    load->onComponentAdded(nullptr); //This is a bit sneaky but we want to init the loadednavmeshdata with out set string

    //TODO: Generate navmesh useable object

    if (!buildSettings) {
        VisualMessageShower::ShowVisibleInfoMessageIfEditor("Rebuilt navmesh with default NavmeshBuildSetup. Please add comp to entity to change settings.");
    } else {
        VisualMessageShower::ShowVisibleInfoMessageIfEditor("Rebuilt navmesh with custom NavmeshBuildSetup");
    }

    std::cout << "Navmesh Generated" << std::endl;
}

bool NavmeshBuildSystem::IsNavmeshLatest() {
    const auto builtNamesh = EntityComponentSystem::GetSingleton<LoadedNavmeshData>();
    if (!builtNamesh) {
        std::cout << "no built namvehs" << std::endl;
        return false;
    }
    const auto currentSurfaces = EntityComponentSystem::GetEntitiesWithData({typeid(NavigatableEntitySurface)}, {});
    std::vector<NavigatableEntitySurface*> orderedSurfaces = currentSurfaces->GetAllComponents<NavigatableEntitySurface>();

    //Check same size at least
    if (orderedSurfaces.size() != builtNamesh->savedSetup.size()) {
        std::cout << "not same length: " << orderedSurfaces.size() << " vs " << builtNamesh->savedSetup.size() << std::endl;
        return false;
    }

    //Extract
    std::sort(orderedSurfaces.begin(), orderedSurfaces.end(), compareByMeshName);
    const auto currentElements = ExtractCachedData(orderedSurfaces);

    return std::equal(currentElements.begin(), currentElements.end(), builtNamesh->savedSetup.begin());
}
