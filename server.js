const express = require('express');
const app = express();
const port = 3333 || process.env.PORT;
const Web3 = require('web3');
const fs = require('fs');
// const truffle_connect = require('./connection/app.js');

const bodyParser = require('body-parser');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
//-----jw 
const http = require('http')

socketExpress = require("express");
socketIO = require("socket.io");
socketCors = require("cors");
socketPort = 5000;
socketApp = express();
socketApp.use(cors());

socketServer = http.createServer(app);

//const server = http.createServer(app);
// socketio 생성후 서버 인스턴스 사용
const io = socketIO(socketServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true,
  },
});
/**
 * io.on의 io는 서버의 객체를 뜻함
 * socket.on의 socket은 클라이언트의 객체를 뜻함 
 * 
 * on은 이벤트를 받는 메서드, emit은 이벤트를 쏘는 메서드
 * 일부 이벤트에 대응하는 콜백 함수의 인자는 지정되어 있음(여기서 connection, join ...)
 */
io.on("connection", (socket) => { //서버가 connection이벤트를 받으면 콜백 수행 
  // join : 채팅 참여 이벤트
  console.log('[소켓온!!!!!]')
  
  //클라이언트로 부터 join이벤트를 받으면 콜백 수행 
  socket.on("join", ({ userName: user, userId: uId, receiverId :rId, roomNumber: room}) => {
    socket.join(room); //클라이언트의 socket에 'room'에 join하겠다. 
    console.log('[서버소켓: ', room, '에 ',user ,'이 입장함]')
    io.to(room).emit("onConnect", `${user} 님이 입장했습니다.`); //클라이언트의 room의 onConnect이벤트와 메시지 보냄
    
    // send : 클라이언트가 메시지 보내는 이벤트
    socket.on("onSend", (messageItem) => {
      io.to(room).emit("onReceive", messageItem);
    });

    socket.on("disconnect", () => {
      socket.leave(room);
      io.to(room).emit("onDisconnect", `${user} 님이 퇴장하셨습니다.`);
    });
  });
});

socketServer.listen(socketPort, () => console.log(`Listening on port ${socketPort}`));
//-----jw 

// env 설정
require('dotenv').config();

// proxy cors 설정
let corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

// view 경로 설정
app.set('views', __dirname + '/views');

// 화면 engine을 ejs로 설정
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

// Router 연결
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/user/users');
const auctionRouter = require('./routes/auctionInfo/auctionInfo');
const userauctioninfoRouter = require('./routes/userAuctionInfo/userAuctionInfo');
const messageinfoRouter = require('./routes/message/messageInfo');

// middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auctions', auctionRouter);
app.use('/userauctioninfo', userauctioninfoRouter);
app.use('/messageInfo', messageinfoRouter);

app.disable('etag');
const options = { etag: false };
app.use(express.static('public', options)); // public 폴더를 웹브라우저 요청에 따라 제공

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error.html');
});

const server = app.listen(port, () => {
  // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  // truffle_connect.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  var imgPath = './public/uploads'; //Create Img Upload File
  if (!fs.existsSync(imgPath)) fs.mkdirSync(imgPath);

  console.log('Express Listening at http://localhost:' + port);
});

module.exports = server;
