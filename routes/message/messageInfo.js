
const { DB, firebaseAdmin, ERRORS, tokenExporter } = require('../commons');
var express = require('express');
var router = express();

//http://localhost:3333/messageInfo/message
router.get('/message', async (req, res, next) => {
    console.log("message 가 왔습니다. ");

    //DB.jwtest.doc("new-city-id2").set({name : "hha"}); //for test 
    DB.messageInfo.doc("msg").set({roomId : "777"});
});
module.exports = router;


  /*d
var msgData = {
    
}
    DB.messageInfo.doc("msg")
    .withConverter(messageConverter)
    .set(new Message("a","b","c","d"));

    const ref = doc(DB, "cities", "LA").withConverter(messageConverter);
    res.send("Hello World");
    await setDoc(ref, new City("Los Angeles", "CA", "USA", "JWS"));
    */

/*
const { DB, firebaseAdmin, ERRORS, tokenExporter } = require('../commons');
var express = require('express');
var router = express();

var firebase = require('firebase')

router.get('/message', async (req, res, next) => {
    console.log("jssss")
    console.log("message 가 왔습니다. ");

  
    DB.messageInfo.doc("msg")
    .withConverter(messageConverter)
    .set(new Message("a","b","c","d"));

    const ref = doc(DB, "cities", "LA").withConverter(messageConverter);
    res.send("Hello World");
    await setDoc(ref, new City("Los Angeles", "CA", "USA", "JWS"));
    
});

module.exports = router;

*/

class Message {
    constructor (userId, receiverId, content, sendTm) {
        this.userId = userId;
        this.state = receiverId;
        this.country = content;
        this.sendTm = sendTm; 
    }
    toString() {
        return this.userId + ', ' + this.state + ', ' + this.country + ', ' + this.sendTm;
    }
}

// Firestore data converter
var messageConverter = {
    toFirestore: function(message) {
        return {
            userId : message.userId,
            state : message.receiverId,
            country : message.content,
            sendTm : message.sendTm
        };
    },
    fromFirestore: function(snapshot, options){
        const data = snapshot.data(options);
        return new City(data.name, data.state, data.country);
    }
};
