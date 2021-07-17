const express = require('express');
const app = express();
const port = 3333 || process.env.PORT;
const Web3 = require('web3');
// const truffle_connect = require('./connection/app.js');

const bodyParser = require('body-parser');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors'); 

// env 설정
require("dotenv").config(); 

// proxy cors 설정
let corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
}

// Router 연결
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/user/users');
const auctionRouter = require('./routes/auctionInfo/auctionInfo');

// middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsOptions)); 

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auctions', auctionRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, () => {
  // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  // truffle_connect.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));

  console.log("Express Listening at http://localhost:" + port);
});
