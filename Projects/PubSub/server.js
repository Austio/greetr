const http = require('http');
const WEB_SOCK_PORT = 1337;
const WEB_PORT = 8080;
const SYSTEM = 'system';
const fs = require('fs');

const WebSocket = require('ws');
const wss = new WebSocket.Server({
  port: WEB_SOCK_PORT
});

const Client = require('./server/client').default;
const Chat = require('./server/chat').default;
const chat = new Chat();

const redis = require("redis");
const $redis = {
  sub: redis.createClient(),
  pub: redis.createClient(),
};

$redis.sub.on("message", (channel, serializedMessage) => {
  chat.message(serializedMessage)
});

$redis.sub.subscribe("chat");

wss.on('connection', function connection(ws) {
  const client = new Client(ws);
  chat.add(client);

  ws.on('message', function incoming(message) {
    const msg = chat.deserialize(message);

    console.log(message);
    $redis.pub.publish("chat", chat.serialize({
      ...msg,
      sender_id: client.id
    }))
  });
});

var server = http.createServer(function (req, res) {
  fs.readFile(__dirname + '/index.html', function (err, f){
    if (err) { return res.writeHead(404) && res.end() }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(f);
    res.end();
  });
});
server.listen(WEB_PORT);