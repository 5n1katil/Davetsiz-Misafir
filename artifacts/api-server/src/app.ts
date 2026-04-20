import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { listRooms } from "./game/gameEngine";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.get("/health", (_req, res) => {
  const rooms = listRooms();
  const activeRooms = rooms.length;
  const activePlayers = rooms
    .flatMap((r) => r.players)
    .filter((p) => p.isConnected).length;

  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    rooms: activeRooms,
    players: activePlayers,
    version: "1.0.0",
    ts: Date.now(),
  });
});

app.get("/health/rooms", (req, res) => {
  if (process.env["NODE_ENV"] === "production") {
    return res.status(404).end();
  }
  const summary = listRooms().map((room) => ({
    code: room.code,
    phase: room.phase,
    players: room.players.length,
    connected: room.players.filter((p) => p.isConnected).length,
    round: room.round,
    createdAt: room.createdAt,
  }));
  return res.json(summary);
});

export default app;
