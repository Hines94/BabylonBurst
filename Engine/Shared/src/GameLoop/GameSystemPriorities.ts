import { NavAgentTransformSystem } from "../Navigation/NavigationAgent";
import { GetSystemOfType } from "./GameSystemLoop";


export const NavAgentTransformUpdatePriority = 150;
export const InstancedRenderSystemPriority = 200;
export const ColliderRenderSystemPriority = 250;
export const LightingGameSystemPriority = 300;
export const NavAgentVisualisationSystemPriority = 350;


export function RegisterDefaultCoreSystems() {
    if(GetSystemOfType(NavAgentTransformSystem) !== undefined) {
        return;
    }
    new NavAgentTransformSystem();
}