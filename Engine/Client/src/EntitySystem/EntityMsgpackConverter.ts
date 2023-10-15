import { decode, encode } from "@msgpack/msgpack";

function getTypingsForComp(compName: string, typings: Array<[string, string[]]>): { id: number; params: string[] } {
    var index = 0;
    typings.forEach(type => {
        if (type[0] === compName) {
            return { id: index, params: type[1] };
        }
        index++;
    });
    return undefined;
}

function createTypingsForComp(
    compName: string,
    compData: any,
    typings: Array<[string, string[]]>
): { id: number; params: string[] } {
    const item: [string, string[]] = [compName, []];
    const keys = Object.keys(compData);
    item[1] = keys;
    typings.push(item);
    return { id: typings.length - 1, params: keys };
}

function addConvertedComponent(
    compName: string,
    compData: { [paramName: string]: any },
    entComps: { [compId: number]: { [paramName: number]: any } },
    typings: { id: number; params: string[] }
) {
    const convertedData: { [paramName: number]: any } = {};
    const keys = Object.keys(compData);
    keys.forEach(paramName => {
        var data = compData[paramName];
        if (data === undefined) {
            data = "";
        }
        for (var i = 0; i < typings.params.length; i++) {
            if (paramName == typings.params[i]) {
                convertedData[i] = data;
                return;
            }
        }
        typings.params.push(paramName);
        convertedData[typings.params.length - 1] = data;
    });
    entComps[typings.id] = convertedData;
}

/** Entity data in raw format - not with any Component object wrappers. Just pure parameter / value pairs. */
export type RawEntityData = {
    [entId: number]: EntitySpecification;
};

/** For an Entity describes the components and parameters inside */
export type EntitySpecification = {
    [compName: string]: { [paramName: string]: any };
};

type Typing = [string, string[]];
/** Converted to MSGPACK format where names are seperated */
type ConvertedEntity = {
    O: number;
    C: { [compId: number]: { [paramName: number]: any } };
};

export function SaveEntitiesToMsgpackIntArrayTyped(Entities: { [entId: number]: Object[] }): number[] {
    console.log(Entities);
    return [];
}

/**
 * Saves with seperate typings etc to save space.
 * NOTE: Does not ignore default values like WASM
 */
export function SaveEntitiesToMsgpackIntArray(Entities: RawEntityData): Uint8Array {
    const typings: Typing[] = [];
    const convertedEntities: ConvertedEntity[] = [];
    const entIds = Object.keys(Entities);
    entIds.forEach(entId => {
        const entityId = parseInt(entId);
        const entComps: { [compId: number]: { [paramName: number]: any } } = {};
        const entity = Entities[entityId];
        Object.keys(entity).forEach(component => {
            let existingTypings = getTypingsForComp(component, typings);

            if (existingTypings === undefined) {
                existingTypings = createTypingsForComp(component, entity[component], typings);
            }

            addConvertedComponent(component, entity[component], entComps, existingTypings);
        });

        convertedEntities.push({ O: entityId, C: entComps });
    });

    const finalObject = {
        T: typings,
        C: convertedEntities,
    };

    return encode(finalObject);
}

/** Load from seperately packaged typings */
export function LoadEntitiesFromMsgpackFormat(inData: any): RawEntityData {
    var data = inData;
    if (inData === undefined) {
        return {};
    }
    if (Array.isArray(inData) || inData instanceof ArrayBuffer || inData instanceof Uint8Array) {
        if ((inData as Uint8Array).length === 0) {
            return {};
        }
        data = decode(inData);
    }

    if (data === undefined) {
        return {};
    }

    const typings: Typing[] = data["T"];
    const convertedEntities: ConvertedEntity[] = data["C"];

    if (typings === undefined || convertedEntities === undefined) {
        return {};
    }

    if (typeof convertedEntities !== "object") {
        return {};
    }

    const entities: { [entId: number]: EntitySpecification } = {};
    convertedEntities.map(convertedEntity => {
        const entity: EntitySpecification = {};

        for (const [compId, compData] of Object.entries(convertedEntity.C)) {
            const [componentName, paramNames] = typings[Number(compId)];
            const component: { [paramName: string]: any } = {};

            paramNames.forEach((paramName, index) => {
                if (compData[index]) {
                    component[paramName] = compData[index];
                }
            });

            entity[componentName] = component;
        }

        entities[convertedEntity.O] = entity;
    });

    return entities;
}

/** Get objected data (easier to work with) */
export function GetComponent<T>(
    entityData: EntitySpecification,
    componentType: { new (): T; name: string } // A constructor that creates an object of type T
): T | undefined {
    const compName = componentType.name;

    if (entityData[compName] === undefined) {
        return undefined;
    }

    const newObject = new componentType();
    const params = Object.keys(entityData[compName]);
    for (var i = 0; i < params.length; i++) {
        const paramName = params[i];
        (newObject as any)[paramName] = entityData[compName][paramName];
    }
    return newObject;
}
