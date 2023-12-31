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
import { getRandomColor3 } from "../Utils/MeshUtils";
import { NavigationAgent } from "./NavigationAgent";
import { GameSystem, GameSystemRunType } from "../GameLoop/GameSystem";
import { NavigationBoxObsticle, NavigationObsticle } from "./NavigationObsticles";
import { InstancedRender } from "../Rendering/InstancedRender";

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

export class NavigationBuildSystem extends GameSystem {
    SystemOrdering = 1;
    systemRunType = GameSystemRunType.GameAndEditor;
    
    SetupGameSystem(ecosystem: GameEcosystem) {
        if(ecosystem.dynamicProperties["___NAVBUILDSYSTEMSETUP___"]) {
            return;
        }
        ecosystem.entitySystem.onComponentChangedEv.add((notify)=>{
            checkRebuildNavSystem(ecosystem,notify);
        });
        RebuildAllNavmeshLayers(ecosystem, rebuildType.OnlyIfData);
        ecosystem.dynamicProperties["___NAVBUILDSYSTEMSETUP___"] = true;
    }
    RunSystem(ecosystem: GameEcosystem) {

    }

}

/** Full rebuild of all navigation layers */
export function RebuildAllNavmeshLayers(ecosystem:GameEcosystem, rebuild = rebuildType.Force) {
    ecosystem.entitySystem.GetEntitiesWithData([NavigationLayer],[]).iterateEntities((e)=>{
        RebuildNavigationLayer(e.GetComponent(NavigationLayer),ecosystem,rebuild);
    })
}

/** Check for rebuild if components have been changed */
async function checkRebuildNavSystem(ecosystem:GameEcosystem,notify:ComponentNotify) {
    if(notify.comp instanceof NavigationLayer) {
        if(notify.comp.autoRebuildLayer) {
            await RebuildNavigationLayer(notify.comp,ecosystem,rebuildType.TryWithData);
        } else {
            await RebuildNavigationLayer(notify.comp,ecosystem,rebuildType.OnlyIfData);
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
        notify.comp.RebuildAgent(navLayer,ecosystem);
        notify.comp.AgentAutoMove();   
    }
    if(notify.comp instanceof NavigationObsticle) {
        const navLayer = NavigationLayer.GetNavigationLayer(notify.comp.targetNavigationLayer,ecosystem.entitySystem);
        notify.comp.RebuildObsticle(navLayer);
    }
    if(notify.comp instanceof EntTransform) {
        const boxOb = notify.ent.GetComponent(NavigationBoxObsticle);
        if(boxOb !== undefined) {
            boxOb.RebuildObsticle(undefined);
        }
        //TODO: Add sphere obst
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
    const builtMeshes:string[] = [];
    const cloneMeshes:Mesh[] = [];
    const navSurfaces:Mesh[] = [];
    const allNavSurfaces = ecosystem.entitySystem.GetEntitiesWithData([NavigationSurface],[]);
    const navSurfaceVec = allNavSurfaces.GetEntitiesArray();
    for(var i = 0; i < navSurfaceVec.length;i++) {
        const surfElement = navSurfaceVec[i].GetComponent(NavigationSurface);
        if(!surfElement.NavigationLayers.includes(navLayer.NavigationLayerName)) {
            continue;
        }
        const model = surfElement.isSameAsRenderer && navSurfaceVec[i].GetComponent(InstancedRender) ? navSurfaceVec[i].GetComponent(InstancedRender).ModelData : surfElement.SurfaceModel;
        if( model === undefined || model.isEmptyModelSpecifier()) {
            continue;
        }
        const asyncMesh = AsyncStaticMeshDefinition.GetStaticMeshDefinitionNoMats(model.FilePath,model.MeshName,model.FileName);
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
            builtMeshes.push(`${model.FilePath}_${model.FileName}_${model.MeshName}`);
        }
    }

    //No rebuild if same for some reason!
    const equalToLastBuild = ArraysContainEqualItems(navLayer.builtSurfaces ,builtSurfaces) && ArraysContainEqualItems(navLayer.builtMeshes, builtMeshes);
    if(buildType === rebuildType.Force || (!equalToLastBuild && buildType === rebuildType.TryWithData)) {
        navLayer.builtSurfaces = builtSurfaces;
        navLayer.builtMeshes = builtMeshes;
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
        const color = getRandomColor3();
        var matdebug = new StandardMaterial("NavDebugMat",ecosystem.scene);
        matdebug.disableLighting = true;
        matdebug.emissiveColor = color;
        matdebug.alpha = 0.1;
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
        agentComp.RebuildAgent(navLayer,ecosystem);
        agentComp.AgentAutoMove();
    }
    
    //Rebuild all Obsticles
    const allObsticles = ecosystem.entitySystem.GetEntitiesWithData([NavigationBoxObsticle],[]);
    allObsticles.iterateEntities(e=>{
        const obComp = e.GetComponent(NavigationBoxObsticle);
        if(obComp.targetNavigationLayer !== navLayer.NavigationLayerName) {
            return;
        }
        obComp.RebuildObsticle(navLayer);
    })
}