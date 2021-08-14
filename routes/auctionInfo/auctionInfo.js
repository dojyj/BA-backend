const express = require('express');
const asyncify = require('express-asyncify');
const asyncRouter = asyncify(express.Router());
const multer = require('multer');
const fs = require('fs');
// const { path } = require('../../server');

const { DB, ERRORS, firebaseAdmin, tokenExporter } = require('../commons');
const { promisify } = require('util');

//upload img
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    },
  }),
  limits: {
    fieldNameSize: 200, // 	Max number of bytes per field name
    fieldSize: 1024 * 1024, // Max number of bytes per field value
    fields: 20, // 	Max number of fields per request ()
    fileSize: 16777216, // Max number of bytes per file
    files: 10, // 	Max number of files per request
  },
  fileFilter: (req, file, cb) => {
    const type_array = file.mimetype.split('/');
    const file_type = type_array[1];

    if (file_type === 'jpg' || file_type === 'jpeg' || file_type === 'png')
      cb(null, true);
    else
      return cb(
        { message: '*.jpg, *.jpeg, *.png 파일만 업로드가 가능합니다' },
        false
      );
  },
});

const unlinkAsync = promisify(fs.unlink);

//Create
asyncRouter.post('/detail', upload.any('img'), async (req, res, next) => {
  const body = JSON.parse(JSON.stringify(req.body));

  if (
    body.title === '' ||
    body.startprice === '' ||
    parseInt(body.startprice) > parseInt(body.reservedprice) ||
    body.startDate === 'Invalid date' ||
    body.endDate === 'Invalid date' ||
    body.uploadtime >= body.startDate ||
    body.startDate >= body.endDate ||
    body.category === ''
  ) {
    const paths = req.files.map((file) => file.path)[0];
    console.log(paths);
    await unlinkAsync(paths);
    return next(ERRORS.DATA.NOT_ALLOWED_DATAFORMAT);
  } else {
    body.category = JSON.parse(body.category);
    if(req.files != null)
      body.productImageURL = req.files;
    body.view = parseInt(body.view);
    body.wish = parseInt(body.wish);
    body.reservedPrice = parseInt(body.reservedPrice);
    body.startPrice = parseInt(body.startPrice);
    body.sellingFailure = parseInt(body.sellingFailure);
    DB.auctionInfo.add(body).then((docRef) => {
      res.status(200).send({success: true, id: docRef.id});
    });
    
  }
});

//Read All Auction List
asyncRouter.get('/list', async (req, res, next) => {
  let auctionList = [];
  var cnt=req.query.cnt;
  console.log(cnt);

  var auctionInfos = DB.auctionInfo
    .get()
    .then((doc) => {
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
asyncRouter.get('/list', async (req, res, next) => {
  var uid = req.query.uid;
  var auctionList = [];

  try {
    // check userID exists
    await firebaseAdmin.auth().getUser(uid);
  } catch (err) {
    return next(ERRORS_AUTH.NO_UID);
  }
  var auctionInfo = await DB.auctionInfo
    .get()
    .then((doc) => {
      // get auctionList
      doc.forEach((item) => {
        if (item.data().sellerId === uid) {
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
asyncRouter.get('/list/category', async (req, res, next) => {
  var category = req.query.category;
  var cnt=req.query.cnt;
  var auctionList = [];
  console.log(req.query);

  var auctionInfo = await DB.auctionInfo
    .get()
    .then((doc) => {
      // get auctionList
      doc.forEach((item) => {
        if (item.data().category.value === category) {
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

//Get Only One Auction that equals to route params id
asyncRouter.get('/list/:id', async (req, res, next) => {
  var auctionId = req.params.id;
  let auction;
  var auctionInfo = await DB.auctionInfo
    .get()
    .then((querySnapshot) => {
      // #1 get auction
      for (let i in querySnapshot.docs) {
        const item = querySnapshot.docs[i];
        console.log(item);
        if (auctionId === item.id) auction = item.data();
      }

      // #2 if auction doesn't exists..
      if (!auction) return next(ERRORS.DATA.NOT_EXISTS);

      res.status(200).send({ success: true, auction });
    })
    .catch((err) => {
      return next(err);
    });
});

//Update
asyncRouter.put('/detail', async (req, res, next) => {
  const body = JSON.parse(JSON.stringify(req.body));

  try {
    var auctionInfo = (await DB.auctionInfo.doc(body.id).get()).data();
    await DB.auctionInfo.doc(body.id).update({
      'category.label': body.hasOwnProperty('category.label')
        ? body.category.label
        : auctionInfo.category.label,
      'category.value': body.hasOwnProperty('category.value')
        ? body.category.value
        : auctionInfo.category.value,
      content: body.hasOwnProperty('content')
        ? body.content
        : auctionInfo.content,
      startDate: body.hasOwnProperty('startDate')
        ? body.startDate
        : auctionInfo.startDate,
      startDate: body.hasOwnProperty('startDate')
        ? body.startDate
        : auctionInfo.startDate,
      endDate: body.hasOwnProperty('endDate')
        ? body.endDate
        : auctionInfo.endDate,
      reservedPrice: body.hasOwnProperty('reservedPrice')
        ? parseInt(body.reservedPrice)
        : auctionInfo.reservedPrice,
      sellerId: body.hasOwnProperty('sellerId')
        ? body.sellerId
        : auctionInfo.sellerId,
      sellingFailure: body.hasOwnProperty('sellingFailure')
        ? parseInt(body.sellingFailure)
        : auctionInfo.sellingFailure,
      state: body.hasOwnProperty('state')
        ? parseInt(body.state)
        : auctionInfo.state,
      uploadTime: body.hasOwnProperty('uploadTime')
        ? body.uploadTime
        : auctionInfo.uploadTime,
      view: body.hasOwnProperty('view')
        ? parseInt(body.view)
        : auctionInfo.view,
      wish: body.hasOwnProperty('wish')
        ? parseInt(body.wish)
        : auctionInfo.wish,
    });
    res.status(200).send({ success: true });
  } catch (err) {
    console.log(err);
    return next(ERRORs.ERRORS);
  }
});

//Delete
asyncRouter.delete('/detail/:id', async (req, res, next) => {
  var auctionId = req.params.id;

  try {
    await DB.auctionInfo.doc(auctionId).delete();
    res.status(200).send({ success: true });
  } catch (err) {
    console.log(err);
    return next(ERRORs.ERRORS);
  }
});


asyncRouter.use((err, _req, res, _next) => {
  switch (err) {
    case ERRORS.DATA.NOT_ALLOWED_DATAFORMAT:
      console.log('NOT ALLOWED DATA FORMAT: ', err);
      res.status(400).send({ error: 'Invalid data' });
      break;
    case ERRORS.DATA.NOT_EXISTS:
      console.log('DATA NOT EXISTS: ', err);
      res.status(400).send({ error: 'This auction no longer exists..' });
      break;
    default:
      console.log('UNHANDLED INTERNAL ERROR: ', err);
      res.status(500).send({ error: 'INTERNAL ERROR' });
      break;
  }
});


module.exports = asyncRouter;
