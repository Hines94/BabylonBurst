import { Mesh, RecastJSPlugin } from "@babylonjs/core";
import { Component } from "../EntitySystem/Component";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";


@RegisteredType(NavigationLayer)
export class NavigationLayer extends Component {

    @TrackedVariable()
    @Saved(String)
    NavigationLayerName = "default";

    @TrackedVariable()
    @Saved(Number)
    CellSize = 0.5;

    @TrackedVariable()
    @Saved(Number)
    CellHeight = 0.5;

    @TrackedVariable()
    @Saved(Number)
    walkableSlopeAngle = 35;

    @TrackedVariable()
    @Saved(Number)
    walkableHeight = 1;

    @TrackedVariable()
    @Saved(Number)
    walkableClimb = 1;

    @TrackedVariable()
    @Saved(Number)
    walkableRadius = 1;

    @TrackedVariable()
    @Saved(Number)
    maxEdgeLen = 12;

    @TrackedVariable()
    @Saved(Number)
    maxSimplificationError = 1.3;

    @TrackedVariable()
    @Saved(Number)
    minRegionArea = 8;

    @TrackedVariable()
    @Saved(Number)
    mergeRegionArea = 20;

    @TrackedVariable()
    @Saved(Number)
    maxVertsPerPoly = 6;

    @TrackedVariable()
    @Saved(Number)
    detailSampleDist = 6;

    @TrackedVariable()
    @Saved(Number)
    detailSampleMaxError = 1;

    navLayerPlugin:RecastJSPlugin;
    debugMesh:Mesh;

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
        console.error(`No navigation layer created for name ${layerName}`);
        return undefined;
    }
}