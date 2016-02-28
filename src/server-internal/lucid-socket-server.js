/* global Buffer */
"use strict";

var WebSocketServer = require("ws").Server;
var Client = require("../structures/LucidClient");
var md5Hex = require('md5-hex');

const protocol_v = require("../lucid-server").protocol_v;

const RawPackets = {
	MAX_CONNS : `{"t":"max_conns"}`
};

function byteLength(res){
	return Buffer.byteLength(res, "utf8");
}

class LucidWebSocketServer extends WebSocketServer{
	
	constructor(options, interfaceServer){
		super(options);
		
		this.wrapper = interfaceServer;
		
		this.clients = [];
		
		this.on("error", error => this.eventError(error));
		this.on("connection", connection => this.eventConnection(connection));

	}
	
	eventError(error){
		this.wrapper.emit("error", error);
	}
	
	eventConnection(connection){
		if(this.clients.length >= this.wrapper.options.max_clients){
			// send to raw for better performance when the server is under stress
			this.wrapper.messaging.sendToRaw(connection, RawPackets.MAX_CONNS);
			return;
		}
		
		var client = new Client(connection, this.wrapper);
		this.clients.push(client);
		
		setTimeout(() => this.checkAuth(client), this.wrapper.options.response_max_wait_time);
	}
	
	eventClientError(client, error){
		client.emit("error", error);
		this.wrapper.emit("clientError", client, error);
		client.disconnect("error");
	}
	
	eventClientClose(client, code, message){
		var reason = client.temp.dc_reason || "unknown";
		client.emit("close", reason, code, message);
		this.wrapper.emit("clientClose", client, reason, code, message);
		client.disconnect("close");
	}
	
	eventClientMessage(client, data, flags){
		var packet = null;
		var heartbeat_interval = this.wrapper.options.heartbeat_interval;
		try{
			packet = JSON.parse(data);
			if(!packet.t){
				client.disconnect("badmessage");
			}
		}catch(e){
			client.disconnect("badmessage");
			return;
		}
		
		packet.d = packet.d || {};

		if(client.authenticated){
			// for clients that have already gone through the auth process
			switch (packet.t){
				case "heartbeat":
					client.setHeartbeatListener(heartbeat_interval);
					break;
				case "disconnect":
					// see if reason is less than 64 bytes, as we are storing the data server
					// side we don't want messages that are too big.
					if(byteLength(packet.d.reason) < 64){
						client.temp.dc_reason = packet.d.reason;
					}else{
						client.disconnect("msg_too_big");
					}
					break;
				default:
					if(packet.t.startsWith("custom_")){
						// custom packets
						var type = packet.t.substr(7);
						
						client.emit("message", type, packet.d);
						this.wrapper.emit("clientMessage", client, type, packet.d);
					}
					break;
			}
		}else{
			// for clients that haven't yet authenticated
			switch (packet.t){
				case "new_auth":
				
					if(!(packet.d.protocol_v && packet.d.protocol_v === protocol_v)){
						client.disconnect("different_protocol", null, `expected ${protocol_v}`);
						return;
					}
					
					client.uuid = client.token = md5Hex(`${Date.now()}-${Math.random() * 1000000}-${this.clients.indexOf(client)}`);
					client.authenticated = true;
					
					client._send({
						t : "authenticated",
						d : {
							token : client.token,
							heartbeat_interval
						}
					});
					
					// if heartbeat is enabled, only then start using it with the client
					if(heartbeat_interval > -1)
						client.setHeartbeatListener(heartbeat_interval);
						
					client.emit("connected", "new");
					this.wrapper.emit("clientConnected", client, "new");
					
					break;
				default:
					break;
			}
		}
	}
	
	checkAuth(client){
		if(!client.authenticated){
			client.disconnect("no_auth");
		}
	}
	
	removeClient(client){
		var index = this.clients.indexOf(client);
		if(index > -1){
			this.clients.splice(index, 1);
			return true;
		}
		return false;
	}
}

module.exports = LucidWebSocketServer;