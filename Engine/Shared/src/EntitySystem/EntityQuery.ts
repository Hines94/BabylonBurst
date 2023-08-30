import { EntityBucket } from "./EntityBucket";
import { EntityData } from "./EntityData";

export class EntityQuery {
    data:EntityBucket[];

    constructor(data:EntityBucket[]){
        this.data = data;
    }

    GetNumEntities():number {
        var n = 0;
        this.data.forEach(d=>{
            n += Object.keys(d.ContainedEntities).length;
        })
        return n;
    }

    iterateEntities(callback: (entity: EntityData) => void) {
        for (let bucket of this.data) {
            for (let entityId in bucket.ContainedEntities) {
                if (bucket.ContainedEntities.hasOwnProperty(entityId)) {
                    const entity = bucket.ContainedEntities[entityId];
                    callback(entity);
                }
            }
        }
    }
}