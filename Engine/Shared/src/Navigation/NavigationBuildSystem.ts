import { Color3, Mesh, RecastJSPlugin, StandardMaterial, Vector3 } from "@babylonjs/core";
import { GameEcosystem } from "../GameEcosystem";
import { NavigationSurface } from "./NavigationSurface";
import { AsyncStaticMeshDefinition } from "../AsyncAssets";
import { EntTransform, EntVector3 } from "../EntitySystem/CoreComponents";
import { NavigationLayer } from "./NavigationLayer";
import { ComponentNotify } from "../EntitySystem/EntitySystem";
import { EntityData } from "../EntitySystem/EntityData";
import { ArraysContainEqualItems } from "../Utils/ArrayUtils";
import Recast from "recast-detour";
import { getRandomColor3 } from "../Utils/MeshUtils";
import { NavigationAgent } from "./NavigationAgent";
import { DeepEquals } from "../Utils/HTMLUtils";

var recast:any;

enum rebuildType {
    /** If data does not exist or is not up to date then no rebuild */
    OnlyIfData,
    /** If existing data exists then we will rebuild */
    TryWithData,
    /** Rebuild no matter what */
    Force
}

/** Setup navigation systems to automatically rebuild themselves on change if opted into this */
export function setupAutoNavBuildSystem(ecosystem:GameEcosystem) {
    if(ecosystem.dynamicProperties["___NAVBUILDSYSTEMSETUP___"]) {
        return;
    }
    ecosystem.entitySystem.onComponentAddedEv.add((notify)=>{
        checkRebuildNavSystem(ecosystem,notify,true);
    });
    ecosystem.entitySystem.onComponentChangedEv.add((notify)=>{
        checkRebuildNavSystem(ecosystem,notify,false);
    });
    RebuildAllNavmeshLayers(ecosystem, rebuildType.OnlyIfData);
    ecosystem.dynamicProperties["___NAVBUILDSYSTEMSETUP___"] = true;
}

/** Full rebuild of all navigation layers */
export function RebuildAllNavmeshLayers(ecosystem:GameEcosystem, rebuild = rebuildType.Force) {
    ecosystem.entitySystem.GetEntitiesWithData([NavigationLayer],[]).iterateEntities((e)=>{
        RebuildNavigationLayer(e.GetComponent(NavigationLayer),ecosystem,rebuild);
    })
}

/** Check for rebuild if components have been changed */
async function checkRebuildNavSystem(ecosystem:GameEcosystem,notify:ComponentNotify, bAdded:boolean) {
    if(notify.comp instanceof NavigationLayer) {
        if(notify.comp.autoRebuildLayer) {
            await RebuildNavigationLayer(notify.comp,ecosystem,rebuildType.TryWithData);
        } else if(bAdded) {
            await RebuildNavigationLayer(notify.comp,ecosystem,rebuildType.OnlyIfData);
        }
    }
    if(notify.comp instanceof NavigationSurface) {
        for(var i = 0; i < notify.comp.NavigationLayers.length;i++) {
            const layer = NavigationLayer.GetNavigationLayer(notify.comp.NavigationLayers[i],ecosystem.entitySystem);
            if(layer && layer.autoRebuildLayer) {
                await RebuildNavigationLayer(layer,ecosystem,rebuildType.TryWithData);
            }
        }
    }
    if(notify.comp instanceof NavigationAgent) {
        const navLayer = NavigationLayer.GetNavigationLayer(notify.comp.targetNavigationLayer,ecosystem.entitySystem);
        RebuildAgent(navLayer,notify.ent);
        
        MoveAgent(ecosystem,notify.comp);   
    }
}

/** Perform full rebuild on a navigation layer */
async function RebuildNavigationLayer(navLayer:NavigationLayer,ecosystem:GameEcosystem, buildType: rebuildType) {

    if(buildType === rebuildType.OnlyIfData && !navLayer.builtData) {
        console.warn("No existing data to rebuild with for navmesh");
        return;
    }

    if(navLayer.navLayerPlugin === undefined) {
        if(recast === undefined) {
            recast = await Recast();
        }
        navLayer.navLayerPlugin = new RecastJSPlugin(recast);
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

    //Get the navigation surfaces we want to build with
    const builtSurfaces:EntityData[] = [];
    const cloneMeshes:Mesh[] = [];
    const navSurfaces:Mesh[] = [];
    const allNavSurfaces = ecosystem.entitySystem.GetEntitiesWithData([NavigationSurface],[]);
    const navSurfaceVec = allNavSurfaces.GetEntitiesArray();
    for(var i = 0; i < navSurfaceVec.length;i++) {
        const surfElement = navSurfaceVec[i].GetComponent(NavigationSurface);
        if(!surfElement.NavigationLayers.includes(navLayer.NavigationLayerName)) {
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
            builtSurfaces.push(navSurfaceVec[i]);
        }
    }

    //No rebuild if same for some reason!
    const equalToLastBuild = ArraysContainEqualItems(navLayer.builtSurfaces ,builtSurfaces);
    if(buildType === rebuildType.Force || (!equalToLastBuild && buildType === rebuildType.TryWithData)) {
        navLayer.builtSurfaces = builtSurfaces;
        navLayer.navLayerPlugin.createNavMesh(navSurfaces,navmeshParameters); 
        navLayer.builtData = navLayer.navLayerPlugin.getNavmeshData();  
    } else if(equalToLastBuild) {
        navLayer.navLayerPlugin.buildFromNavmeshData(navLayer.builtData);
    }
    
    //Cleanup clone meshes
    for(var m = 0; m < cloneMeshes.length;m++) {
        cloneMeshes[m].dispose();
    }

    //TODO: Hide navmesh unless option is shown
    if(navLayer.debugMesh !== undefined) {
        navLayer.debugMesh.dispose(); 
    }
    navLayer.debugMesh = navLayer.navLayerPlugin.createDebugNavMesh(ecosystem.scene);
    if(ecosystem.dynamicProperties["___DEBUGNAVMESHMATERIAL___"+navLayer.NavigationLayerName] === undefined) {
        var matdebug = new StandardMaterial('matdebug', ecosystem.scene);
        matdebug.diffuseColor = getRandomColor3()
        matdebug.alpha = 0.2;
        ecosystem.dynamicProperties["___DEBUGNAVMESHMATERIAL___"+navLayer.NavigationLayerName] = matdebug;
    }
    navLayer.debugMesh.material = ecosystem.dynamicProperties["___DEBUGNAVMESHMATERIAL___"+navLayer.NavigationLayerName];
    navLayer.debugMesh.position = new Vector3(0,0.01,0);

    //Rebuild navigation crowd
    navLayer.navLayerCrowd = navLayer.navLayerPlugin.createCrowd(navLayer.maxCrowdNumber,navLayer.maxAgentRadius,ecosystem.scene);

    //TODO: Rebuild all agents
    console.error("Rebuild all agents!")
}

function RebuildAgent(navLayer:NavigationLayer,agentEnt:EntityData) {
    if(navLayer === undefined) {
        return;
    }
    const agent = agentEnt.GetComponent(NavigationAgent);
    if(agent === undefined){
        return;
    }
    const newParams = agent.getAgentParams();
    if(DeepEquals(newParams,agent.priorBuildParams)) {
        return;
    }
    if(navLayer.navLayerCrowd === undefined) {
        return;
    }
    const transform = agentEnt.GetComponent(EntTransform);
    if(transform === undefined) {
        return;
    }
    agent.agentIndex = navLayer.navLayerCrowd.addAgent(EntVector3.GetVector3(transform.Position),newParams,);
    agent.priorBuildParams = newParams;
}

function MoveAgent(navLayer:NavigationLayer,agentEnt:EntityData) {
    if(navLayer === undefined) {
        return;
    }
    const agent = agentEnt.GetComponent(NavigationAgent);
    if(agent === undefined){
        return;
    }
    if(agent.agentIndex === undefined) {
        return;
    }   
    //Already set target?
    if(EntVector3.Equals(agent.TargetLocation, agent.priorMoveTarget)) {
        return;
    }

    navLayer.navLayerCrowd.agentGoto(agent.agentIndex,EntVector3.GetVector3(agent.TargetLocation));

    agent.priorMoveTarget = EntVector3.clone(agent.TargetLocation);
}