"use strict";

var md5Hex = require('md5-hex');

class LucidGroup{
	
	constructor(server, options){
		this.server = server;
		this.members = [];
		this.uuid = md5Hex(`${Date.now()}-${Math.random() * 1000000}`);
		
		this.options = options;
	}
	
	removeMember(client){
		var index = this.members.indexOf(client)
		if(index > -1){
			this.members.splice(index, 1);
		}else{
			return false;
		}
	}
	
	removeMembers(clients){
		return clients.map(client => this.removeMember(client));
	}
	
	addMembers(clients){
		return clients.map(client => this.addMember(client));
	}
	
	addMember(client){
		if(!client.in(this.members)){
			return true;
		}else{
			return false;
		}
	}
	
	broadcast(packet){
		return this.send(packet);
	}
	
	send(packet){
		packet.d = packet.d || {};
		packet.d.group = true;
		this.members.map(client => this.server.messaging.sendTo(client.ws, packet));
	}
	
	sendRaw(data){
		this.members.map(client => this.server.messaging.sendToRaw(client.ws, data));
	}
	
}

module.exports = LucidGroup;