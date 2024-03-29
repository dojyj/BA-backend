const express = require('express');
const asyncify = require('express-asyncify');
const asyncRouter = asyncify(express.Router());
const multer = require('multer');
const fs = require('fs');

const { DB, ERRORS, firebaseAdmin, tokenExporter } = require('../commons');
const { promisify } = require('util');
const ethValue = 5000000;

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

const getPriceUnit = (price) => {
  let unit = String(parseInt(price * 0.05));
  if (parseInt(unit[0]) < 5) unit = '1'.padEnd(unit.length, '0');
  else unit = '5'.padEnd(unit.length, '0');

  return parseInt(unit);
};

//Read All Auction List === 이거 지우면 되나??

asyncRouter.get('/list/:page', async (req, res, next) => {
  var auctionList = [];
  var pageNumber = req.params.page; // (더보기)click cnt
  var pageCnt = 3; // total auctionList cnt

  var first = DB.auctionInfo.orderBy('startDate').limit(pageNumber * pageCnt);
  //>>>>>>> master

  first
    .get()
    .then((doc) => {
      if (pageNumber == 1) {
        // page number is 1
        doc.forEach((item) => {
          if (item != undefined) {
            var each = {};
            each['_id'] = item.id;
            each['startDate'] = item.data().startDate;
            each['endDate'] = item.data().endDate;
            each['state'] = item.data().state;
            each['title'] = item.data().title;
            each['startPrice'] = item.data().startPrice;
            auctionList.push(each);
          }
        });
        res.status(200).send({ success: true, auctionList });
      } else {
        var lastVisible = doc.docs[doc.docs.length - 1];
        var next = DB.auctionInfo
          .orderBy('startDate')
          .startAfter(lastVisible)
          .limit(pageCnt)
          .get()
          .then((document) => {
            document.forEach((item) => {
              if (item != undefined) {
                var each = {};
                each['_id'] = item.id;
                each['startDate'] = item.data().startDate;
                each['endDate'] = item.data().endDate;
                each['state'] = item.data().state;
                each['title'] = item.data().title;
                each['startPrice'] = item.data().startPrice;
                auctionList.push(each);
              }
            });
            res.status(200).send({ success: true, auctionList });
          });
      }
    })
    .catch((err) => {
      console.log('Error getting document', err);
      return next(err);
    });
});

//Read Auction List Using user_id
asyncRouter.get('/list/:id/:page', async (req, res, next) => {
  var uid = req.params.id;
  var auctionList = [];
  var pageNumber = req.params.page; // page number
  var pageCnt = 3; // total auctionList cnt

  try {
    // check userID exists
    await firebaseAdmin.auth().getUser(uid);
  } catch (err) {
    return next(ERRORS_AUTH.NO_UID);
  }

  var first = DB.auctionInfo
    .where('sellerId', '==', uid)
    .limit(pageNumber * pageCnt);

  first
    .get()
    .then((doc) => {
      if (pageNumber == 1) {
        // page number is 1
        doc.forEach((item) => {
          if (item != undefined) {
            var each = {};
            each['_id'] = item.id;
            each['startDate'] = item.data().startDate;
            each['endDate'] = item.data().endDate;
            each['state'] = item.data().state;
            each['title'] = item.data().title;
            each['startPrice'] = item.data().startPrice;
            auctionList.push(each);
          }
        });
        res.status(200).send({ success: true, auctionList });
      } else {
        var lastVisible = doc.docs[doc.docs.length - 1];
        var next = DB.auctionInfo
          .where('sellerId', '==', uid)
          .startAfter(lastVisible)
          .limit(pageCnt)
          .get()
          .then((document) => {
            document.forEach((item) => {
              if (item != undefined) {
                var each = {};
                each['_id'] = item.id;
                each['startDate'] = item.data().startDate;
                each['endDate'] = item.data().endDate;
                each['state'] = item.data().state;
                each['title'] = item.data().title;
                each['startPrice'] = item.data().startPrice;
                auctionList.push(each);
              }
            });
            res.status(200).send({ success: true, auctionList });
          });
      }
    })
    .catch((err) => {
      return next(err);
    });
});

//Read Auction List Using category_name
asyncRouter.get('/list/category/:label/:page', async (req, res, next) => {
  var category = req.params.label;
  var pageNumber = req.params.page;
  var pageCnt = 3; // total auctionList cnt

  var auctionList = [];

  var first = DB.auctionInfo
    .where('category.value', '==', category)
    .limit(pageNumber * pageCnt);

  first
    .get()
    .then((doc) => {
      if (pageNumber == 1) {
        // page number is 1
        doc.forEach((item) => {
          if (item != undefined) {
            var each = {};
            each['_id'] = item.id;
            each['startDate'] = item.data().startDate;
            each['endDate'] = item.data().endDate;
            each['state'] = item.data().state;
            each['title'] = item.data().title;
            each['startPrice'] = item.data().startPrice;
            each['img'] = item.data().productImageURL;
            each['view'] = item.data().view;
            each['wish'] = item.data().wish;
            auctionList.push(each);
          }
        });
        res.status(200).send({ success: true, auctionList });
      } else {
        // page number >= 2
        var lastVisible = doc.docs[doc.docs.length - 1];
        var next = DB.auctionInfo
          .where('category.value', '==', category)
          .startAfter(lastVisible)
          .limit(pageCnt)
          .get()
          .then((document) => {
            document.forEach((item) => {
              if (item != undefined) {
                var each = {};
                each['_id'] = item.id;
                each['startDate'] = item.data().startDate;
                each['endDate'] = item.data().endDate;
                each['state'] = item.data().state;
                each['title'] = item.data().title;
                each['startPrice'] = item.data().startPrice;
                each['imgPath'] = item.data().productImageURL;
                each['wish'] = item.data().wish;
                auctionList.push(each);
              }
            });
            res.status(200).send({ success: true, auctionList });
          });
      }
    })
    .catch((err) => {
      return next(err);
    });
});

// Auction Progress GET
asyncRouter.get('/progress/:id', async (req, res, next) => {
  const progressId = req.params.id;
  let progressInfo;

  await DB.progressInfo
    .get()
    .then((querySnapshot) => {
      for (let info of querySnapshot.docs) {
        if (progressId == info.id) progressInfo = info.data();
      }

      if (!progressInfo) return next(ERRORS.PROGRESS.NOT_EXISTS);

      res.status(200).send({ success: true, progressInfo });
    })
    .catch((err) => {
      return next(err);
    });
});

// Auction Progress PATCH (User, Price, PriceUnit)
asyncRouter.patch('/progress/:id', async (req, res, next) => {
  const progressId = req.params.id;
  const body = JSON.parse(JSON.stringify(req.body));
  var highest_price = body.Price;

  try {
    var request_list = (await DB.progressInfo.doc(progressId).get()).data();

    for (let request of request_list.requestList) {
      console.log(request);
      if (request.UID === body.UID && request.Price === body.Price) {
        return next(ERRORS.PROGRESS.DUP_REQUESTS);
      }

      if (highest_price <= request.Price)
        return next(ERRORS.PROGRESS.INVALID_REQUESTS);
    }

    if (
      (highest_price * ethValue - request_list.price) %
        request_list.priceUnit !=
      0
    )
      return next(ERRORS.PROGRESS.INVALID_REQUESTS);

    // update progress info
    const list = request_list.requestList;
    list.push(body);
    const price = highest_price * ethValue;
    const priceUnit = getPriceUnit(price);

    await DB.progressInfo.doc(progressId).update({
      requestList: list,
      price: price,
      priceUnit: priceUnit,
    });

    res.status(200).send({ success: true });
  } catch (err) {
    console.log(err);
    return next(ERRORS.ERRORS);
  }
});

// Auction Progress POST
const postAuctionProgress = async (price) => {
  const progressInfo = {};

  progressInfo.price = price;
  progressInfo.priceUnit = getPriceUnit(progressInfo.price);
  progressInfo.requestList = [];

  const progressDoc = await DB.progressInfo.add(progressInfo);

  return progressDoc;
};

// Auction Details GET
asyncRouter.get('/detail/:id', async (req, res, next) => {
  var auctionId = req.params.id;
  var auction;
  var auctionInfo = await DB.auctionInfo
    .get()
    .then((querySnapshot) => {
      console.log(querySnapshot);
      // #1 get auction
      for (var i in querySnapshot.docs) {
        const item = querySnapshot.docs[i];
        // console.log(item);
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

// Auction Details POST
asyncRouter.post('/detail', upload.any('img'), async (req, res, next) => {
  const body = JSON.parse(JSON.stringify(req.body));

  if (
    // Check Auction Item Format
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
    if (req.files != null) body.productImageURL = req.files;
    body.view = parseInt(body.view);
    body.wish = parseInt(body.wish);
    body.reservedPrice = parseInt(body.reservedPrice);
    body.startPrice = parseInt(body.startPrice);
    body.sellingFailure = parseInt(body.sellingFailure);

    // create progressInfo DB
    const progressDoc = await postAuctionProgress(body.startPrice);
    body.progressInfo = progressDoc.id;

    DB.auctionInfo.add(body).then((docRef) => {
      res.status(200).send({ success: true, id: docRef.id });
    });
  }
});

// Auction Details PUT
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

// Auction Details DELETE
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

// Auction API ERRORS
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
    case ERRORS.PROGRESS.NOT_EXISTS:
      console.log('DATA NOT EXISTS: ', err);
      res
        .status(400)
        .send({ error: 'This auction progress is not exits now..' });
      break;
    case ERRORS.PROGRESS.DUP_REQUESTS:
      console.log('Request is Duplicated : ', err);
      res.status(400).send({ error: 'Duplicate Requests..' });
      break;
    case ERRORS.PROGRESS.INVALID_REQUESTS:
      console.log('Request is invalid : ', err);
      res.status(400).send({ error: 'invalid Requests..' });
      break;
    default:
      console.log('UNHANDLED INTERNAL ERROR: ', err);
      res.status(500).send({ error: 'INTERNAL ERROR' });
      break;
  }
});

module.exports = asyncRouter;
