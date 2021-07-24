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
    DB.auctionInfo.add(body);
    res.status(200).end();
  }
});

//Read All Auction List
asyncRouter.post('/list', async (req, res, next) => {
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
asyncRouter.get("/auction", async(req, res, next) => {
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

//Read Auction List Using category_id
asyncRouter.get("/auction", async(req, res, next) => {
  var categoryId = req.query.category_id;
  var auctionList = [];

  var auctionInfo = await DB.auctionInfo.get().then((doc) => { // get auctionList
    doc.forEach((item) => {
      if(item.data().categoryId === categoryId) {
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

//Update
// asyncRouter.put("/auction", async(req, res, next) => {
  
//   try {

//   } catch (err) {
//     return next(ERRORs.ERRORS); // No Exist auctionList._id
//   }

// });



//Delete

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
