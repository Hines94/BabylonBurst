import { BitSet } from "../Utils/BitSet";
import { EntityData } from "./EntityData";


export class EntityBucket {
    ContainedEntities:{[entId:number]:EntityData} = [];
    SetComponents = new BitSet(256);

    ChangeEntityToThisBucket(ent:EntityData) {
        EntityBucket.RemoveEntityFromAnyBuckets(ent);
        this.ContainedEntities[ent.EntityId] = ent;
        ent.____oldbucket___ = this;
    }

    static RemoveEntityFromAnyBuckets(ent:EntityData) {
        if(ent.____oldbucket___) {
            const oldb = ent.____oldbucket___ as EntityBucket;
            delete(oldb.ContainedEntities[ent.EntityId]);
        }
        ent.____oldbucket___ = undefined;
    }
}