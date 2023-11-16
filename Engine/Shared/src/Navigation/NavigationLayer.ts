import { ICrowd, INavMeshParameters, Mesh, PickingInfo, Ray, RecastJSPlugin, Vector3 } from "@babylonjs/core";
import { Component } from "../EntitySystem/Component";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { EntityData } from "../EntitySystem/EntityData";


@RegisteredType(NavigationLayer,{comment:`E.g sea/land/rocks. Use default if only desire one layer.`})
export class NavigationLayer extends Component {

    @TrackedVariable()
    @Saved(String)
    NavigationLayerName = "default";

    @TrackedVariable()
    @Saved(Boolean,{comment:"Will auto rebuild on any change. Can be preformance heavy if adding multiple nav surfaces in sequence."})
    autoRebuildLayer = false;

    @TrackedVariable()
    @Saved(Number,{comment:"Smaller is more granular but takes longer"})
    CellSize = 0.5;

    @TrackedVariable()
    @Saved(Number,{comment:"Smaller is more granular but takes longer"})
    CellHeight = 0.5;

    @TrackedVariable()
    @Saved(Number,{comment:"Max degrees of walkable slope"})
    walkableSlopeAngle = 35;

    @TrackedVariable()
    @Saved(Number,{comment:"Max height (cell Units) that is considered climbale"})
    walkableHeight = 1;

    @TrackedVariable()
    @Saved(Number,{comment:"Minimum floor to 'ceiling' height that will still allow the floor area to be considered walkable"})
    walkableClimb = 1;

    @TrackedVariable()
    @Saved(Number,{comment:"How close an agent can get to an obstruction"})
    walkableRadius = 1;

    @TrackedVariable()
    @Saved(Number,{comment:"Will auto rebuild on any change. Can be preformance heavy if adding multiple nav surfaces in sequence."})
    maxEdgeLen = 12;

    @TrackedVariable()
    @Saved(Number,{comment:"Will auto rebuild on any change. Can be preformance heavy if adding multiple nav surfaces in sequence."})
    maxSimplificationError = 1.3;

    @TrackedVariable()
    @Saved(Number,{comment:"Minimum size in cells allowed to form an island region"})
    minRegionArea = 8;

    @TrackedVariable()
    @Saved(Number,{comment:"Any regions smaller than this will be merged if possible"})
    mergeRegionArea = 20;

    @TrackedVariable()
    @Saved(Number)
    maxVertsPerPoly = 6;

    @TrackedVariable()
    @Saved(Number,{comment:"distance between height samples used for the detail mesh. Smaller - more detail but more memory."})
    detailSampleDist = 6;

    @TrackedVariable()
    @Saved(Number,{comment:"Maximum distance the detail mesh surface should deviate from the heightfield data. Smaller increases complexity."})
    detailSampleMaxError = 1;

    @TrackedVariable()
    @Saved(Number,{comment:"Maximum number of agents allowed in a crowd"})
    maxCrowdNumber = 100;

    @TrackedVariable()
    @Saved(Number,{comment:"Maximum radius of any agent in a crowd"})
    maxAgentRadius = 10;


    @Saved(EntityData,{editorViewOnly:true,comment:"Entities that haved been used previously to store our data against"})
    builtSurfaces:EntityData[] = [];
    @Saved(Uint8Array,{editorViewOnly:true,comment:"Preloaded data that has been previously generated for our navmesh"})
    builtData:Uint8Array;

    navLayerBuilt = false;
    navLayerPlugin:RecastJSPlugin;
    navLayerCrowd:ICrowd;
    debugMesh:Mesh;

    GetNavmeshParameters() : INavMeshParameters {
        const navLayer = this;
        return {
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
    
    }

    /** Raycast the navigation layer to get the nearest position */
    RaycastForPosition(ray:Ray) : Vector3 {
        if(this.debugMesh === undefined || !this.navLayerBuilt) {
            return undefined;
        }
        const hit = ray.intersectsMesh(this.debugMesh);
        if(!hit.hit) {
            return undefined;
        }
        return this.navLayerPlugin.getClosestPoint(hit.pickedPoint);
    }
    
    /** Get a navigation layer comp by name that has been created and added to an Entity */
    static GetNavigationLayer(layerName = "default",entSystem:EntitySystem) : NavigationLayer {
        const allLayers = entSystem.GetEntitiesWithData([NavigationLayer],[]);
        const iterLayers = allLayers.GetEntitiesArray();
        for(var i = 0; i < iterLayers.length;i++) {
            const navLayerItem = iterLayers[i].GetComponent(NavigationLayer);
            if(navLayerItem.NavigationLayerName === layerName) {
                return navLayerItem;
            }
        }
        return undefined;
    }

    static ShowDebugNavmeshes(bShow:boolean,entSystem:EntitySystem) {
        const allNavmeshes = entSystem.GetEntitiesWithData([NavigationLayer],[]);
        allNavmeshes.iterateEntities(e=>{
            const nmLayer = e.GetComponent(NavigationLayer);
            if(nmLayer.debugMesh) {
                nmLayer.debugMesh.isVisible = bShow;
            }
        })
    }

    GetPointInRadius(center:Vector3, maxRadius:number, minRadius = 0) {
        if(this.navLayerPlugin === undefined) {
            return undefined;
        }
        
        if(minRadius === 0) {
            return this.navLayerPlugin.getRandomPointAround(center,maxRadius);
        }

        const angle = Math.random() * Math.PI * 2;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);

        const x = center.x + radius * Math.cos(angle);
        const z = center.z + radius * Math.sin(angle);
        const y = center.y;

        return this.navLayerPlugin.getClosestPoint(new Vector3(x,y,z));
    }
}