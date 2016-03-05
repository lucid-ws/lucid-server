"use strict";

var md5Hex = require("md5-hex");

class LucidGroup {

	constructor(server, options) {
		this.server = server;
		this.clients = [];

		while (true) {
			this.uuid = md5Hex(`${Date.now() }-${Math.random() * 1000000}`);
			for (var group of server.groups) {
				if (group.uuid === this.uuid) {
					continue;
				}
			}
			break;
		}

		this.options = options;
	}

	removeClient(client) {
		var index = this.clients.indexOf(client);
		if (index > -1) {
			this.clients.splice(index, 1);
		} else {
			return false;
		}
	}

	removeClients(connections) {
		connections = connections || [];
		return connections.map(client => this.removeClient(client));
	}

	addClients(connections) {
		connections = connections || [];
		return connections.map(client => this.addClient(client));
	}

	addClient(client) {
		if (!client.in(this.clients)) {
			this.clients.push(client);
			return true;
		} else {
			return false;
		}
	}

	broadcast(type, data) {
		return this.clients.map(client => client.send(type, data));
	}

	broadcastExcept(type, data, exceptions) {
		return this.clients.map(client => {
			if (!client.in(exceptions)) {
				return client.send(type, data);
			}
			return false;
		});
	}

	broadcastRaw(data) {
		return this.clients.map(client => this.server.messaging.sendToRaw(client.ws, data));
	}

	broadcastRawExcept(data, exceptions) {
		return this.clients.map(client => {
			if (!client.in(exceptions)) {
				return this.server.messaging.sendToRaw(client.ws, data);
			}
			return false;
		});
	}

}

module.exports = LucidGroup;