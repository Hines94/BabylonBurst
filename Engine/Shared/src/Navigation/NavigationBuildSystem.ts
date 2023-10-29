import { Color3, Mesh, RecastJSPlugin, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";
import { GameEcosystem } from "../GameEcosystem";
import { NavigationSurface } from "./NavigationSurface";
import { AsyncStaticMeshDefinition } from "../AsyncAssets";
import { EntTransform, EntVector3 } from "../EntitySystem/CoreComponents";
import { NavigationLayer } from "./NavigationLayer";
import { ComponentNotify } from "../EntitySystem/EntitySystem";
import { EntityData } from "../EntitySystem/EntityData";
import { ArraysContainEqualItems } from "../Utils/ArrayUtils";
import Recast from "recast-detour";
import { GetRandomColor4, getRandomColor3 } from "../Utils/MeshUtils";
import { NavigationAgent } from "./NavigationAgent";
import { DeepEquals } from "../Utils/HTMLUtils";
import { AsyncSimpleImageMaterial } from "../Materials/AsyncSimpleImageMaterial";

var recast:any;

enum rebuildType {
    /** Warn if out of date */
    Warn,
    /** If data does not exist or is not up to date then no rebuild */
    OnlyIfData,
    /** If existing data exists then we will rebuild */
    TryWithData,
    /** Rebuild no matter what */
    Force,
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
        } else {
            RebuildNavigationLayer(notify.comp,ecosystem,rebuildType.Warn);
        }
    }
    if(notify.comp instanceof NavigationSurface) {
        for(var i = 0; i < notify.comp.NavigationLayers.length;i++) {
            const layer = NavigationLayer.GetNavigationLayer(notify.comp.NavigationLayers[i],ecosystem.entitySystem);
            if(layer) {
                if(layer.autoRebuildLayer) {
                    await RebuildNavigationLayer(layer,ecosystem,rebuildType.TryWithData);
                } else {
                    RebuildNavigationLayer(layer,ecosystem,rebuildType.Warn);
                }
            }
        }
    }
    if(notify.comp instanceof NavigationAgent) {
        const navLayer = NavigationLayer.GetNavigationLayer(notify.comp.targetNavigationLayer,ecosystem.entitySystem);
        RebuildAgent(navLayer,notify.ent,ecosystem);
        MoveAgent(navLayer,notify.ent);   
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
        navLayer.navLayerPlugin.createNavMesh(navSurfaces,navLayer.GetNavmeshParameters()); 
        navLayer.builtData = navLayer.navLayerPlugin.getNavmeshData(); 
        navLayer.navLayerBuilt = true; 
    } else if(equalToLastBuild) {
        if(buildType !== rebuildType.Warn) {
            navLayer.navLayerPlugin.buildFromNavmeshData(navLayer.builtData);
            navLayer.navLayerBuilt = true; 
        }
    } else {
        ecosystem.DisplayErrorIfEditor("Navmesh is dirty and requires a rebuild (view->RebuildNavmesh)")
    }
    
    //Cleanup clone meshes
    for(var m = 0; m < cloneMeshes.length;m++) {
        cloneMeshes[m].dispose();
    }

    //If just warning then return no need to go further
    if(buildType === rebuildType.Warn) {
        return;
    }
    
    //Create debug mesh
    if(navLayer.debugMesh !== undefined) {
        navLayer.debugMesh.dispose(); 
    }
    navLayer.debugMesh = navLayer.navLayerPlugin.createDebugNavMesh(ecosystem.scene);
    if(ecosystem.dynamicProperties["___DEBUGNAVMESHMATERIAL___"+navLayer.NavigationLayerName] === undefined) {
        const color = GetRandomColor4(0.1);
        var matdebug = new AsyncSimpleImageMaterial({color:color}).GetMaterial(ecosystem.scene);
        ecosystem.dynamicProperties["___DEBUGNAVMESHMATERIAL___"+navLayer.NavigationLayerName] = matdebug;
    }
    navLayer.debugMesh.material = ecosystem.dynamicProperties["___DEBUGNAVMESHMATERIAL___"+navLayer.NavigationLayerName];
    navLayer.debugMesh.position = new Vector3(0,0.01,0);
    if(!ecosystem.dynamicProperties["___DEBUGVISNAVMESH___"]) {
        navLayer.debugMesh.isVisible = false;
    }

    //Rebuild navigation crowd
    navLayer.navLayerCrowd = navLayer.navLayerPlugin.createCrowd(navLayer.maxCrowdNumber,navLayer.maxAgentRadius,ecosystem.scene);

    //Rebuild all agents
    const allAgents = ecosystem.entitySystem.GetEntitiesWithData([NavigationAgent],[]).GetEntitiesArray();
    for(var a = 0; a < allAgents.length;a++) {
        const agentComp = allAgents[a].GetComponent(NavigationAgent);
        if(agentComp.targetNavigationLayer !== navLayer.NavigationLayerName) {
            continue;
        }
        RebuildAgent(navLayer,allAgents[a],ecosystem);
        MoveAgent(navLayer,allAgents[a]);
    }
    
}

function RebuildAgent(navLayer:NavigationLayer,agentEnt:EntityData, ecosystem:GameEcosystem) {
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
    if(agent.transformNode === undefined) {
        agent.transformNode = new TransformNode(`NavAgentTransform_${agentEnt.EntityId}`,ecosystem.scene);
    }
    agent.agentIndex = navLayer.navLayerCrowd.addAgent(EntVector3.GetVector3(transform.Position),newParams,agent.transformNode);
    agent.priorBuildParams = newParams;
    EntVector3.Copy(transform.Position,EntVector3.VectorToEnt(agent.transformNode.position));
}

function MoveAgent(navLayer:NavigationLayer,agentEnt:EntityData) {
    if(navLayer === undefined) {
        return;
    }
    if(agentEnt === undefined) {
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

    if(EntVector3.Zero(agent.TargetLocation)) {
        agent.IsStopped = true;
    } else {
        const closestPos = navLayer.navLayerPlugin.getClosestPoint(EntVector3.GetVector3(agent.TargetLocation));
        navLayer.navLayerCrowd.agentGoto(agent.agentIndex,closestPos);
        agent.IsStopped = false;
    }
    agent.priorMoveTarget = EntVector3.clone(agent.TargetLocation);
}