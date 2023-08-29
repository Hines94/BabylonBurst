import { decode } from "@msgpack/msgpack";
import { GameEcosystem } from "../GameEcosystem";
import { DisposeOfObject, WaitForTime } from "../Utils/SceneUtils";

export var serverConnection: ServerConnection;

export enum MessageToServType {
    inputs,
    placeItem,
    removeBuildRequest,
    interactRequest,
    enterBuildMode,
    addDecal,
}

var retryConnectionAttempts = 0;

async function retryServerConnection() {
    if (retryConnectionAttempts > 10) {
        console.log(">10 retry connect attempts. Quitting");
        return;
    }
    await WaitForTime(1);
    retryConnectionAttempts++;
    new ServerConnection();
}

/** A connection to the server that we are currently on */
export class ServerConnection {
    socket: WebSocket;
    currentLatency: number = 0;

    serverMessages: ArrayBuffer[] = [];

    constructor() {
        serverConnection = this;
        console.log("Attempting to connect to server");

        const ws = new WebSocket("ws://localhost:8080/ws");
        ws.binaryType = "arraybuffer";
        this.socket = ws;

        ws.addEventListener("open", function (event) {
            console.log("Server connection established");
            retryConnectionAttempts = 0;
        });

        ws.addEventListener("message", function (event) {
            serverConnection.ProcessIncomingServerMessage(event.data);
        });

        ws.addEventListener("error", function (event) {
            //console.log("Websocket error");
        });

        ws.addEventListener("close", function (event) {
            console.log("Disconnected from server websocket");
            serverConnection.dispose();
            retryServerConnection();
        });
    }

    async ProcessIncomingServerMessage(message: any) {
        const serverData = await inflateArrayBuffer(message);
        serverConnection.serverMessages.push(serverData);
    }

    ProcessQueuedServerMessages(ecosystem: GameEcosystem) {
        for (var i = 0; i < this.serverMessages.length; i++) {
            ecosystem.wasmWrapper.ProcessServerMessage(this.serverMessages[i]);
        }
        this.serverMessages = [];
    }

    SendMessageToServer(message: string | ArrayBufferLike | Blob | ArrayBufferView, type: MessageToServType) {
        if (this.socket.readyState !== this.socket.OPEN) {
            return;
        }
        const data = JSON.stringify({ MessageType: type, Payload: message });
        this.socket.send(data);
    }

    dispose() {
        console.error("TODO: Cleanup WASM?");
        serverConnection = undefined;
        DisposeOfObject(this);
    }
}

async function inflateArrayBuffer(compressedData: any) {
    //@ts-ignore
    if (typeof DecompressionStream === "undefined") {
        throw new Error("DecompressionStream API is not supported in this browser.");
    }

    // Create a DecompressionStream for 'deflate'
    //@ts-ignore
    const ds = new DecompressionStream("deflate");

    // Create a readable stream from the compressed data
    const compressedStream = new ReadableStream({
        start(controller) {
            controller.enqueue(compressedData);
            controller.close();
        },
    });

    // Pipe the compressed data through the decompression stream
    const decompressedStream = compressedStream.pipeThrough(ds);

    // Read the decompressed data into a Uint8Array
    return await new Response(decompressedStream).arrayBuffer();
}
