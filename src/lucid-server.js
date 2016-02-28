"use strict";

exports.protocol_v = "alpha2";

var WebSocketServer = require("ws").Server;
var MergeOptions = require("./util/options-default").merge;
var EventEmitter = require("events").EventEmitter;

var LucidClient = require("./structures/LucidClient");
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
}

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
		return this._app.internalAPIRouter;
	}
	
	get connections(){
		return this.wss.connections;
	}
	
	createGroup(options, members){
		var group = new LucidGroup(this, options);
		group.addMembers(members);
		this.groups.push(group);
		return group;
	}

}

module.exports = LucidServer;