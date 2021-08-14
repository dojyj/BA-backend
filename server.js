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
  var imgPath = './uploads'; //Create Img Upload File
  if (!fs.existsSync(imgPath)) fs.mkdirSync(imgPath);

  console.log('Express Listening at http://localhost:' + port);
});

module.exports = server;
