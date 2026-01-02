import * as signalR from "@microsoft/signalr";

// Auto-detect backend URL
const API_BASE =
  process.env.NODE_ENV === "development"
    ? "https://localhost:7178"
    : process.env.REACT_APP_API_URL;

let connection = null;

export function getConnection() {
  return connection;
}

export function createConnection(token) {
  if (!token) return null;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE}/hub/notifications`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .build();

  return connection;
}