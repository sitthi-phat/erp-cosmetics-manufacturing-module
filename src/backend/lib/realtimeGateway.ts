import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { config } from "../config";

/**
 * realtimeGateway (ADR-004). Thin wrapper around Socket.IO so services never import
 * socket.io directly - they just call `realtimeGateway.emitStockChanged(payload)` after a
 * stock-affecting DB transaction commits successfully.
 */
export interface RealtimeGateway {
  emit(event: string, payload: unknown): void;
  emitStockChanged(payload: { materialId: number }): void;
}

class SocketRealtimeGateway implements RealtimeGateway {
  private io: SocketIOServer | null = null;

  attach(server: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(server, {
      path: config.socketPath,
      cors: { origin: config.corsOrigin, credentials: true }
    });
    this.io.on("connection", (socket) => {
      socket.join("stock");
    });
    return this.io;
  }

  emit(event: string, payload: unknown): void {
    this.io?.to("stock").emit(event, payload);
  }

  emitStockChanged(payload: { materialId: number }): void {
    this.emit("stock.changed", payload);
  }
}

export const realtimeGateway: RealtimeGateway & { attach: (server: HttpServer) => SocketIOServer } =
  new SocketRealtimeGateway();
