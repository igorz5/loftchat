const WebSocket = require("ws");
const log = require("fancy-log");
const cuid = require("cuid");
const express = require("express");
const { createServer } = require("http");

require("dotenv").config();
const app = express();

const server = createServer(app);
const port = process.env.PORT || 3020;
const wss = new WebSocket.Server({ server });
const users = {};
const handlers = {};

wss.on("connection", (ws, req) => {
  const address = req.socket.address().address;
  const id = cuid();

  log.info(`[${address}] ${id} connecting...`);

  onConnected(ws, id);

  ws.on("close", () => {
    onDisconnected(id);
  });

  ws.on("message", (rawData) => {
    try {
      const data = JSON.parse(rawData);
      if (data._type) {
        runHandler(data._type, data._id, data.data);
      }
    } catch (error) {
      console.error(error);
    }
  });

  registerHandlers();
});

server.listen(port, () => {
  log(`Server started on port ${port}`);
});

function registerHandlers() {
  addHandler("auth", (id, { name }) => {
    if (!name && name.length === 0) return;

    log.info(`${name} connected`);

    users[id].data.name = name;
    const usersData = Object.keys(users).reduce((acc, userId) => {
      if (userId !== id) {
        acc[userId] = users[userId].data;
      }
      return acc;
    }, {});

    sendToUser(id, "auth", { usersData });
    broadcast("user_connect", { id, userData: users[id].data });
  });

  addHandler("send_message", (id, { message }) => {
    const user = users[id];
    if (!user) return;

    log(`${user.name} sent message`);
    broadcast("send_message", { id, message });
  });

  addHandler("update_profile_photo", (id, { imgData }) => {
    const user = users[id];
    if (!user) return;

    log(`${user.name} updated profile photo`);
    user.data.profilePhoto = imgData;
    broadcast("update_profile_photo", { id, imgData });
  });
}

function onConnected(ws, id) {
  users[id] = {
    ws,
    data: {
      profilePhoto: null,
      name: "Unknown",
    },
  };

  sendToUser(id, "init", { id });
}

function onDisconnected(id) {
  const user = users[id];
  if (!user) return;

  log.info(`${user.data.name} disconnected`);

  delete users[id];

  broadcast("user_disconnect", { id });
}

function sendToUser(id, type, data) {
  const user = users[id];
  if (!user) return;

  user.ws.send(JSON.stringify({ _type: type, data }));
}

function broadcast(type, data, exclude) {
  for (const id of Object.keys(users)) {
    if (!exclude || exclude !== id) {
      sendToUser(id, type, data);
    }
  }
}

function addHandler(type, handler) {
  handlers[type] = handler;
}

function runHandler(type, id, data) {
  const handler = handlers[type];
  if (!handler || !id) return;

  handler(id, data);
}
