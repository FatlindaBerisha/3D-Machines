import * as signalR from "@microsoft/signalr";
import { HUB_URL } from "../config";

let connection = null;

export function getConnection() {
    return connection;
}

export function createConnection(token) {
    if (!token) return null;
    if (connection) return connection;

    connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
            accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

    return connection;
}

/**
 * Safely invokes a SignalR method, waiting for the connection to be ready if necessary.
 */
export async function safeInvoke(methodName, ...args) {
    if (!connection) {
        console.warn(`[SignalR] Cannot invoke ${methodName}: No connection object.`);
        return;
    }

    try {
        // If disconnected, try to start it
        if (connection.state === signalR.HubConnectionState.Disconnected) {
            console.log(`[SignalR] Connection disconnected, starting before ${methodName}...`);
            await connection.start();
        }

        // Wait if it's currently connecting or reconnecting
        let attempts = 0;
        while (connection.state === signalR.HubConnectionState.Connecting ||
            connection.state === signalR.HubConnectionState.Reconnecting) {
            attempts++;
            if (attempts > 50) throw new Error("SignalR connection timeout");
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        if (connection.state === signalR.HubConnectionState.Connected) {
            return await connection.invoke(methodName, ...args);
        } else {
            console.error(`[SignalR] Failed to invoke ${methodName}: State is ${connection.state}`);
        }
    } catch (err) {
        console.error(`[SignalR] Error in safeInvoke(${methodName}):`, err);
        throw err;
    }
}