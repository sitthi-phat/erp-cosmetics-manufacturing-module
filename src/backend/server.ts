import http from "http";
import { createApp } from "./app";
import { config } from "./config";
import { realtimeGateway } from "./lib/realtimeGateway";

const app = createApp();
const server = http.createServer(app);

realtimeGateway.attach(server);

server.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[erp-core-prototype] backend listening on :${config.port} (${config.nodeEnv})`);
});
