import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/** socket.io client (ADR-004) - lazily connected, subscribes to room 'stock' server-side. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({ path: "/rt", withCredentials: true, autoConnect: true });
  }
  return socket;
}

export const STOCK_POLL_FALLBACK_MS = 30000;
