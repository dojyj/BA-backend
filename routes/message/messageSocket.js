
import http from '../../server.js'

socketExpress = require("express");
socketIO = require("socket.io");
socketCors = require("cors");
socketPort = 5000;
socketApp = express();
socketApp.use(cors());

socketServer = http.createServer(app);

//const server = http.createServer(app);
// socketio 생성후 서버 인스턴스 사용
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // join : 채팅 참여 이벤트
  console.log('[소켓온!!!!!]')
  socket.on("join", ({ roomName: room, userName: user }) => {
    socket.join(room);
    io.to(room).emit("onConnect", `${user} 님이 입장했습니다.`);
    // send : 클라이언트가 메시지 보내는 이벤트
    // itesm: {name: String, msg: String, timeStamp: String}
    socket.on("onSend", (messageItem) => {
      io.to(room).emit("onReceive", messageItem);
    });

    socket.on("disconnect", () => {
      socket.leave(room);
      io.to(room).emit("onDisconnect", `${user} 님이 퇴장하셨습니다.`);
    });
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
