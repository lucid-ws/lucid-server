"use strict";

exports.protocol_v = "alpha3";

var MergeOptions = require("./util/options-default");
var EventEmitter = require("events").EventEmitter;

var LucidMessagingService = require("./server-internal/lucid-messaging");
var LucidWebSocketServer = require("./server-internal/lucid-socket-server");
var LucidApp = require("./server-internal/lucid-app");
var LucidGroup = require("./structures/LucidGroup");

const http = require("http");

var defaultOptions = {
	ws : {},
	http : {},
	port: 25543,
	max_connections: 10,
	response_max_wait_time : 5000,
	lenient : false,
	heartbeat_interval : 30000,
	reconnect_max_wait_time : 1000 * 60 * 5,
	max_return_queue : 100,
	send_missed_on_reconnect : true
};

class LucidServer extends EventEmitter{

	constructor(options) {

		super();

		this.options = options = MergeOptions(options, defaultOptions);
		this.timeouts = [];

		this.groups = [];

		this.messaging = new LucidMessagingService(this);

		this.app = new LucidApp(options.http, this);

		options.ws.server = this.app.httpServer;
		options.ws.path = "/ws";
		this.wss = new LucidWebSocketServer(options.ws, this);
	}

	get api(){
		return this.app.customAPIRouter;
	}

	get connections(){
		return this.wss.connections;
	}

	get clients(){
		return this.wss.connections;
	}

	createGroup(options, members){
		var group = new LucidGroup(this, options);
		group.addMembers(members);
		this.groups.push(group);
		return group;
	}

	deleteGroup(group){
		var index = this.groups.indexOf(group);
		if(index > -1){
			this.groups.splice(index, 1);
		}
		return false;
	}

	broadcast(type, data){
		return this.wss.connections.map(client => client.send(type, data));
	}

	broadcastRaw(data){
		return this.wss.connections.map(connection => this.messaging.sendToRaw(connection.ws, data));
	}

	broadcastExcept(type, data, exceptions){
		return this.wss.connections.map(client => {
			if(!client.in(exceptions)){
				return client.send(type, data);
			}
			return false;
		});
	}

	broadcastRawExcept(data, exceptions){
		return this.wss.connections.map(client => {
			if(!client.in(exceptions)){
				return this.messaging.sendToRaw(client.ws, data);
			}
			return false;
		});
	}

	hasListener(type){
		return this.listeners(type).length > 0;
	}
}

module.exports = LucidServer;