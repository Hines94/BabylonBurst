import { serverConnection } from "../Networking/ServerConnection";
import { ConnectionOwnedEntity } from "@BabylonBurstCore/Networking/ConnectionOwnedEntity";

export function GetLocalPlayerId(): string {
    if (serverConnection === undefined) {
        return ConnectionOwnedEntity.LocalConnectionOwnerId;
    }
    console.log("TODO:");
    return undefined;
}
