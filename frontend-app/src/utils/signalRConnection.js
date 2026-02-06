import * as signalR from "@microsoft/signalr";

let connection = null;

export function getConnection() {
    return connection;
}

export function createConnection(token) {
    if (!token) return null;

    connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5151/hub/notifications", {
            accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

    return connection;
}
