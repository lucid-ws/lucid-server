"use strict";

exports.protocol_v = "alpha2";

var MergeOptions = require("./util/options-default").merge;
var EventEmitter = require("events").EventEmitter;

var LucidMessagingService = require("./server-internal/lucid-messaging");
var LucidWebSocketServer = require("./server-internal/lucid-socket-server");
var LucidApp = require("./server-internal/lucid-app");
var LucidGroup = require("./structures/LucidGroup");

var defaultOptions = {
	api_port: 25543,
	wss_port: 25544,
	max_connections: 10,
	response_max_wait_time : 5000,
	lenient : false,
	heartbeat_interval : 30000
};

class LucidServer extends EventEmitter{

	constructor(options) {

		super();

		this.options = options = MergeOptions(options, defaultOptions);
		this.timeouts = [];

		this.groups = [];

		this.messaging = new LucidMessagingService(this);
		options.port = options.wss_port;
		this.wss = new LucidWebSocketServer(options, this);
		this._app = new LucidApp(this);

	}

	get api(){
		return this._app.customAPIRouter;
	}

	get connections(){
		return this.wss.connections;
	}

	get clients(){
		return this.wss.clients;
	}

	createGroup(options, members){
		var group = new LucidGroup(this, options);
		group.addMembers(members);
		this.groups.push(group);
		return group;
	}

	broadcast(type, data){
		this.wss.connections.map(client => client.send(type, data));
	}

	broadcastRaw(data){
		this.wss.connections.map(connection => this.messaging.sendToRaw(connection.ws, data));
	}

	broadcastExcept(type, data, exceptions){
		return this.wss.connections.map(client => {
			if(!client.in(exceptions)){
				return client.send(type, data);
			}
			return false;
		});
	}
}

module.exports = LucidServer;