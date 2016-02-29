"use strict";

class LucidMessagingService{
	constructor(server){
		this.server = server;
	}

	sendToRaw(recipient, message){
		recipient.send(message);
	}

	sendTo(recipient, packet){
		recipient.send(JSON.stringify(packet));
	}
}

module.exports = LucidMessagingService;