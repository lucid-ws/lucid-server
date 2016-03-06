"use strict";

class LucidMessagingService{
	constructor(server){
		this.server = server;
	}

	sendToRaw(recipient, message, callback){
		recipient.send(message, null, callback);
	}

	sendTo(recipient, packet, callback){
		recipient.send(JSON.stringify(packet), null, callback);
	}
}

module.exports = LucidMessagingService;