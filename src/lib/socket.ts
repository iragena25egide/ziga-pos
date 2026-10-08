import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    let baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "https://194.164.72.181.nip.io";
    
    // Normalize: remove trailing slash and '/api'
    baseUrl = baseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

    socket = io(baseUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("[Ziga POS] Socket.IO Connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Ziga POS] Socket.IO Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Ziga POS] Socket.IO connection warning:", err.message);
    });
  }

  return socket;
};
