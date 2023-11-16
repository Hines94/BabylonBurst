import { Component } from "../EntitySystem/Component";
import { EntityData } from "../EntitySystem/EntityData";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";

const connectionEntities:{[id:string]:{[entId:string]:EntityData}} = {};

@RegisteredType(ConnectionOwnedEntity,{comment:"This entity is owned by a connection (player)"})
export class ConnectionOwnedEntity extends Component {

    static LocalConnectionOwnerId = "LocalConnection";

    @TrackedVariable()
    @Saved(String, {comment:"Connection Id of the owner for this entity"})
    connectionOwner = "";

    private setConnectionOwner = "";

    onComponentChanged(entData: EntityData): void {
        this.ResetConnectionOwner(entData);
    }

    onComponentRemoved(entData: EntityData): void {
        this.connectionOwner = "";
        this.ResetConnectionOwner(entData);
    }

    /** Reset to latest so we can easily find all owned entites */
    private ResetConnectionOwner(entData: EntityData) {
        if (this.setConnectionOwner !== "") {
            if(this.setConnectionOwner === this.connectionOwner) {
                return;
            }
            delete (connectionEntities[this.setConnectionOwner][entData.EntityId]);
            this.setConnectionOwner = "";
        }
        if(this.connectionOwner === "") {
            return;
        }
        if(connectionEntities[this.connectionOwner] === undefined){
            connectionEntities[this.connectionOwner] = {};
        }
        connectionEntities[this.connectionOwner][entData.EntityId] = entData;
    }

    /** Is an entity owned by our local connection (or offline) */
    static IsEntityOwnedLocally(entData:EntityData) {
        const ownC = entData.GetComponent(ConnectionOwnedEntity);
        if(ownC === undefined) {
            return false;
        }
        return ownC.connectionOwner === ConnectionOwnedEntity.LocalConnectionOwnerId;
        //TODO: If we have a connection use that to check too!
    }
    
    /** All entities owned by this client (offline or connectionid) */
    static GetAllLocallyOwnedEntities() : {[entId:string]:EntityData} {
        //TODO: If we have a connection use that to check too!
        return connectionEntities[ConnectionOwnedEntity.LocalConnectionOwnerId];
    }

    /** All entities owned by a certain connection */
    static GetAllOwnedEntites(connectionId:string) : {[entId:string]:EntityData} {
        return connectionEntities[connectionId];
    }

    /** All known to this entity system */
    static GetAllConnectionIds():string[] {
        return Object.keys(connectionEntities);
    }
}