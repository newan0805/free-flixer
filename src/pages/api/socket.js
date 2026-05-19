import { initWatchTogetherSocket } from "@utils/watchTogetherSocket";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (!res.socket.server.io) {
    res.socket.server.io = initWatchTogetherSocket(res.socket.server);
  }

  res.end();
}
