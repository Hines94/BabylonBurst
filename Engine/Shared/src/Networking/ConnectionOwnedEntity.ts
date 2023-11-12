import { Component } from "../EntitySystem/Component";
import { EntityData } from "../EntitySystem/EntityData";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";

/** For situations where we are playing offline */
export const LocalConnectionOwnerId = "LocalConnection";

const connectionEntities:{[id:string]:{[entId:string]:EntityData}} = {};

@RegisteredType(ConnectionOwnedEntity,{comment:"This entity is owned by a connection (player)"})
export class ConnectionOwnedEntity extends Component {
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

    AddLocalConnectionOwner(entity:EntityData) {
        if(entity.GetComponent(ConnectionOwnedEntity) === undefined) {
            (entity.owningSystem as EntitySystem).AddSetComponentToEntity(entity,new ConnectionOwnedEntity());
        }
        const ownerCon = entity.GetComponent(ConnectionOwnedEntity);
        ownerCon.connectionOwner = LocalConnectionOwnerId;
        ownerCon.ResetConnectionOwner(entity);
    }
}

/** Is an entity owned  */
export function IsEntityOwnedLocally(entData:EntityData) {
    const ownC = entData.GetComponent(ConnectionOwnedEntity);
    if(ownC === undefined) {
        return false;
    }
    return ownC.connectionOwner === LocalConnectionOwnerId;
    //TODO: If we have a connection use that to check too!
}

export function GetAllLocallyOwnedEntities() : {[entId:string]:EntityData} {
    //TODO: If we have a connection use that to check too!
    return connectionEntities[LocalConnectionOwnerId];
}

export function GetAllOwnedEntites(connectionId:string) : {[entId:string]:EntityData} {
    return connectionEntities[connectionId];
}