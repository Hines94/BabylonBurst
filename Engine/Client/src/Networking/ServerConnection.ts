import { GameSystem } from "@engine/GameLoop/GameSystem";
import { DisposeOfObject, WaitForTime } from "../Utils/SceneUtils";
import { GameEcosystem } from "@engine/GameEcosystem";
import { ConnectionProcessingPriority } from "@engine/GameLoop/GameSystemPriorities";

export var serverConnection: ServerConnection;

export class ServerConnectionProcesserSystem extends GameSystem {
    SystemOrdering = ConnectionProcessingPriority;

    SetupGameSystem(ecosystem: GameEcosystem) {

    }

    RunSystem(ecosystem: GameEcosystem) {
        if (serverConnection !== undefined) {
            serverConnection.ProcessQueuedServerMessages(ecosystem);
        }
    }
}

/** A connection to the server that we are currently on */
export class ServerConnection {
    socket: WebSocket;
    bDesireClose = false;
    currentLatency: number = 0;
    maxConnectionRetryAttempts = 10;

    serverMessages: ArrayBuffer[] = [];
    attemptConnectPromise: Promise<void>;

    private connectionAddress = "ws://localhost:8080/ws";
    private retryConnectionAttempts = 0;

    constructor(desiredAddress = "ws://localhost:8080/ws") {
        this.connectionAddress = desiredAddress;
        console.log(`Attempting to connect to server @ ${desiredAddress}`);
    }

    async AttemptToConnect() {
        if (this.socket !== undefined) {
            this.socket.close();
        }

        const connect = this;

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this.connectionAddress);
            ws.binaryType = "arraybuffer";
            this.socket = ws;

            ws.addEventListener("open", function (event) {
                console.log("Server connection established");
                connect.retryConnectionAttempts = 0;
                resolve(connect.connectionAddress); // Successfully connected
            });

            ws.addEventListener("message", function (event) {
                connect.ProcessIncomingServerMessage(event.data);
            });

            ws.addEventListener("error", function (event) {
                console.log("Websocket error");
                attemptReconnection(resolve, reject);
            });

            ws.addEventListener("close", function (event) {
                console.log("Disconnected from server websocket");
                attemptReconnection(resolve, reject);
            });
        });

        function attemptReconnection(resolve: (value: unknown) => void, reject: (reason?: any) => void) {
            if (!connect.bDesireClose) {
                connect
                    .retryConnectionAttempt()
                    .then(resolve) // This will propagate the successful connection resolve to the outer promise
                    .catch(reject);
            } else {
                connect.dispose();
            }
        }
    }

    async retryConnectionAttempt() {
        if (this.retryConnectionAttempts >= this.maxConnectionRetryAttempts) {
            const errorMsg = `>${this.maxConnectionRetryAttempts} retry connect attempts to ${this.connectionAddress}. Quitting`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        this.retryConnectionAttempts += 1;
        await WaitForTime(1);
        return this.AttemptToConnect();
    }

    async ProcessIncomingServerMessage(message: any) {
        const serverData = await inflateArrayBuffer(message);
        this.serverMessages.push(serverData);
    }

    ProcessQueuedServerMessages(ecosystem: GameEcosystem) {
        console.error("TODO: Process queued messages!");
        // for (var i = 0; i < this.serverMessages.length; i++) {
        //     ecosystem.wasmWrapper.ProcessServerMessage(this.serverMessages[i]);
        // }
        this.serverMessages = [];
    }

    SendMessageToServer(message: number[], type: number) {
        if (this.socket.readyState !== this.socket.OPEN) {
            return;
        }
        const data = JSON.stringify({ MessageType: type, Payload: message });
        this.socket.send(data);
    }

    dispose() {
        if (serverConnection === this) {
            serverConnection = undefined;
        }
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
