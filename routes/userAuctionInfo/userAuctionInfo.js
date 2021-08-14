const express = require('express');
const asyncify = require('express-asyncify');
const asyncRouter = asyncify(express.Router());

const { DB, ERRORS, firebaseAdmin, tokenExporter } = require('../commons');

asyncRouter.get('/wish', async (req, res, next) => {
  var uid = req.query.userId;
  var auctionId = req.query.auctionId;
  var wish = False;

  try {
    // check userID exists
    await firebaseAdmin.auth().getUser(uid);
  } catch (err) {
    return next(ERRORS_AUTH.NO_UID);
  }
  var wishinfo = DB.userAuctionInfo.doc(uid);
  var idlist = await wishinfo.listCollections().auctionId;
  idlist.forEach((item) =>{
    if(item == auctionId ){
      wish = True;
    }
  });
  res.status(200).send({ success: true, wish });
});

module.exports = asyncRouter;