import { Color3, Mesh, RecastJSPlugin, StandardMaterial, Vector3 } from "@babylonjs/core";
import { GameEcosystem } from "../GameEcosystem";
import { NavigationSurface } from "./NavigationSurface";
import { AsyncStaticMeshDefinition } from "../AsyncAssets";
import { EntTransform } from "../EntitySystem/CoreComponents";
import { NavigationLayer } from "./NavigationLayer";


export function setupNavBuildSystem(ecosystem:GameEcosystem) {
    //ecosystem.entitySystem.onComponentAddedEv.add(checkRebuildNavSystem)
}

function checkRebuildNavSystem() {

}

async function RebuildNavigationLayer(navLayer:NavigationLayer,ecosystem:GameEcosystem) {
    if(navLayer.navLayerPlugin === undefined) {
        navLayer.navLayerPlugin = new RecastJSPlugin();
        //TODO: Service worker?
    }

    var navmeshParameters = {
        cs: navLayer.CellSize,
        ch: navLayer.CellHeight,
        walkableSlopeAngle: navLayer.walkableSlopeAngle,
        walkableHeight: navLayer.walkableHeight,
        walkableClimb: navLayer.walkableClimb,
        walkableRadius: navLayer.walkableRadius,
        maxEdgeLen: navLayer.maxEdgeLen,
        maxSimplificationError: navLayer.maxSimplificationError,
        minRegionArea: navLayer.minRegionArea,
        mergeRegionArea: navLayer.mergeRegionArea,
        maxVertsPerPoly: navLayer.maxVertsPerPoly,
        detailSampleDist: navLayer.detailSampleDist,
        detailSampleMaxError: navLayer.detailSampleMaxError,
    };

    const cloneMeshes:Mesh[] = [];
    const navSurfaces:Mesh[] = [];
    const allNavSurfaces = ecosystem.entitySystem.GetEntitiesWithData([NavigationSurface],[]);
    const navSurfaceVec = allNavSurfaces.GetEntitiesArray();
    for(var i = 0; i < navSurfaceVec.length;i++) {
        const surfElement = navSurfaceVec[i].GetComponent(NavigationSurface);
        if(surfElement.NavigationLayerName !== navLayer.NavigationLayerName) {
            continue;
        }
        if(surfElement.SurfaceModel === undefined || surfElement.SurfaceModel.isEmptyModelSpecifier()) {
            continue;
        }
        const asyncMesh = AsyncStaticMeshDefinition.GetStaticMeshDefinitionNoMats(surfElement.SurfaceModel.FilePath,surfElement.SurfaceModel.MeshName,surfElement.SurfaceModel.FileName);
        await asyncMesh.loadInMesh(ecosystem.scene);
        const finalMesh = asyncMesh.GetFinalMesh(ecosystem.scene);
        if(finalMesh !== undefined && finalMesh !== null) {
            const transform = navSurfaceVec[i].GetComponent(EntTransform);
            if(transform) {
                const transformClone = finalMesh.clone();
                EntTransform.SetTransformForMesh(transformClone,transform);
                navSurfaces.push(transformClone);
                cloneMeshes.push(transformClone);
            } else {
                navSurfaces.push(finalMesh);
            }
        }
        
    }

    navLayer.navLayerPlugin.createNavMesh(navSurfaces,navmeshParameters);
    
    //Cleanup clone meshes
    for(var m = 0; m < cloneMeshes.length;m++) {
        cloneMeshes[m].dispose();
    }

    //TODO: Hide navmesh unless option is shown
    if(navLayer.debugMesh === undefined) {
        navLayer.debugMesh.dispose(); 
    }
    navLayer.debugMesh = navLayer.navLayerPlugin.createDebugNavMesh(ecosystem.scene);
    if(ecosystem.dynamicProperties["___DEBUGNAVMESHMATERIAL___"] === undefined) {
        var matdebug = new StandardMaterial('matdebug', ecosystem.scene);
        matdebug.diffuseColor = new Color3(0.1, 0.2, 1);
        matdebug.alpha = 0.2;
    }
    navLayer.debugMesh.material = ecosystem.dynamicProperties["___DEBUGNAVMESHMATERIAL___"];
    navLayer.debugMesh.position = new Vector3(0,0.01,0);
}