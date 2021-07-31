const express = require('express');
const asyncify = require('express-asyncify');
const asyncRouter = asyncify(express.Router());
const multer = require('multer');
const { path } = require('../../server');

const {
  DB,
  ERRORS,
  firebaseAdmin,
  tokenExporter,
} = require('../commons');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    },
  }),
});

//Create
asyncRouter.post('/detail', upload.any('img'), (req, res, next) => {
  const body = JSON.parse(JSON.stringify(req.body));

  body.category = JSON.parse(body.category);
  body.productImageURL = req.files;

  if (
    body.title === '' ||
    body.startprice === '' ||
    body.startprice > body.reservedprice ||
    body.uploadtime >= body.startDate ||
    body.startDate >= body.endDate ||
    body.category === ''
  ) {
    return next(ERRORS.NOT_ALLOWED_DATAFORMAT);
  } else {
    console.log(body);
    body.view = parseInt(body.view);
    body.wish = parseInt(body.wish);
    body.reservedPrice = parseInt(body.reservedPrice);
    body.startPrice = parseInt(body.startPrice);
    body.sellingFailure = parseInt(body.sellingFailure);
    DB.auctionInfo.add(body);
    res.status(200).end();
  }
});

//Read All Auction List
asyncRouter.get('/list', async (req, res, next) => {
  let auctionList = [];

  var auctionInfos = DB.auctionInfo.get().then((doc) => {
    doc.forEach((item) => {
      var each = item.data();
      each['_id'] = item.id;
      auctionList.push(each);
    });
    res.status(200).send({ success: true, auctionList });
  })
  .catch((err) => {
    console.log('Error getting document', err);
    return next(err);
  });
});

//Read Auction List Using user_id
asyncRouter.get("/list", async(req, res, next) => {
  var uid = req.query.uid;
  var auctionList = [];

  try { // check userID exists
    await firebaseAdmin.auth().getUser(uid);
  } catch (err) {
    return next(ERRORS_AUTH.NO_UID);
  }
  var auctionInfo = await DB.auctionInfo.get().then((doc) => { // get auctionList
    doc.forEach((item) => {
      if(item.data().sellerId === uid) {
        each = item.data();
        each['_id'] = item.id;
        auctionList.push(each);
      }
    });
    res.status(200).send({ success: true, auctionList });
  })
  .catch((err) => {
    return next(err);
  });
});

//Read Auction List Using category_name
asyncRouter.get("/list/category", async(req, res, next) => {
  var category = req.query.category;
  var auctionList = [];

  var auctionInfo = await DB.auctionInfo.get().then((doc) => { // get auctionList
    doc.forEach((item) => {
      if(item.data().category.value === category) {
        each = item.data();
        each['_id'] = item.id;
        auctionList.push(each);
      }
    });
    res.status(200).send({ success: true, auctionList });
  })
  .catch((err) => {
    return next(err);
  });
});

//Read Auction List Using auction_id
asyncRouter.get("/list/id", async(req, res, next) => {
  var auctionId = req.query.auctionId;
  var auction = [];

  var auctionInfo = await DB.auctionInfo.get().then((doc) => { // get auctionList
    doc.forEach((item) => {
      if(item.id === auctionId) {
        auction['_id'] = item.id;
        auction.push(item.data());
      }
    });
    res.status(200).send({ success: true, auction});
  })
  .catch((err) => {
    return next(err);
  });
});

//Update
asyncRouter.put("/detail", async(req, res, next) => {
  const body = JSON.parse(JSON.stringify(req.body));

  try {
    var auctionInfo = (await DB.auctionInfo.doc(body.id).get()).data();
    await DB.auctionInfo.doc(body.id).update({
      'category.label': body.hasOwnProperty('category.label') ? body.category.label : auctionInfo.category.label,
      'category.value': body.hasOwnProperty('category.value') ? body.category.value : auctionInfo.value,
      'content': body.hasOwnProperty('content')? body.content : auctionInfo.content,
      'startDate': body.hasOwnProperty('startDate')? body.startDate : auctionInfo.startDate,
      'startDate': body.hasOwnProperty('startDate')? body.startDate : auctionInfo.startDate,
      'endDate': body.hasOwnProperty('endDate')? body.endDate : auctionInfo.endDate,
      'reservedPrice': body.hasOwnProperty('reservedPrice')? body.reservedPrice : auctionInfo.reservedPrice,
      'sellerId': body.hasOwnProperty('sellerId')? body.sellerId : auctionInfo.sellerId,
      'sellingFailure': body.hasOwnProperty('sellingFailure')? body.sellingFailure : auctionInfo.sellingFailure,
      'state': body.hasOwnProperty('state')? body.state : auctionInfo.state,
      'uploadTime': body.hasOwnProperty('uploadTime')? body.uploadTime : auctionInfo.uploadTime,
      'view': body.hasOwnProperty('view')? body.view : auctionInfo.view,
    });
    res.status(200).send({ success: true});
  } catch (err) {
    console.log(err);
    return next(ERRORs.ERRORS);
  }

});

//Delete
asyncRouter.delete("/detail/:id", async(req, res, next) => {
  var auctionId = req.params.id;
  
  try {
    await DB.auctionInfo.doc(auctionId).delete();
    res.status(200).send({ success: true}); 
  } catch (err) {
    console.log(err);
    return next(ERRORs.ERRORS);
  }

})

asyncRouter.use((err, _req, res, _next) => {
  switch (err) {
    case ERRORS.NOT_ALLOWED_DATAFORMAT:
      res.status(400).send({ error: 'Invalid data' });
      break;
    default:
      console.log('UNHANDLED INTERNAL ERROR: ', err);
      res.status(500).send({ error: 'INTERNAL ERROR' });
      break;
  }
});

module.exports = asyncRouter;
