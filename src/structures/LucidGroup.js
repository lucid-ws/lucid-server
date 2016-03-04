"use strict";

var md5Hex = require("md5-hex");

class LucidGroup{

	constructor(server, options){
		this.server = server;
		this.members = [];

		while(true){
			this.uuid = md5Hex(`${Date.now()}-${Math.random() * 1000000}`);
			for(var group of server.groups){
				if(group.uuid === this.uuid){
					continue;
				}
			}
			break;
		}

		this.options = options;
	}

	removeMember(client){
		var index = this.members.indexOf(client);
		if(index > -1){
			this.members.splice(index, 1);
		}else{
			return false;
		}
	}

	removeMembers(connections){
		connections = connections || [];
		return connections.map(client => this.removeMember(client));
	}

	addMembers(connections){
		connections = connections || [];
		return connections.map(client => this.addMember(client));
	}

	addMember(client){
		if(!client.in(this.members)){
			this.members.push(client);
			return true;
		}else{
			return false;
		}
	}

	broadcast(type, data){
		return this.send(type, data);
	}

	broadcastExcept(type, data, exceptions){
		return this.sendExcept(type, data, exceptions);
	}

	sendExcept(type, data, exceptions){
		return this.members.map(client => {
			if(!client.in(exceptions)){
				return client.send(type, data);
			}
			return false;
		});
	}

	send(type, data){
		return this.members.map(client => client.send(type, data));
	}

	sendRaw(data){
		return this.members.map(client => this.server.messaging.sendToRaw(client.ws, data));
	}

}

module.exports = LucidGroup;