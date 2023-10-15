import { Component, RegisteredComponent, Saved } from "./Component";

export type PrefabPackedType = {
    prefabID:string;
    prefabData:any;
}

@RegisteredComponent
export class Prefab extends Component {
    @Saved
    /** UUID that can be used to easily identify prefab type */
    PrefabIdentifier:string;
    @Saved
    /** entity Index identifier */
    EntityIndex:number;
}