var Message = function () { };

Message.prototype = { 
	userId : Number,
    content : String,
    sendTm : Number,
    receiverId : Number,
};

export default Message; 