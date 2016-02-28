"use strict";

const WebSocket = require("ws");
const EventEmitter = require("events").EventEmitter;

class LucidClient extends EventEmitter{
	constructor(ws, interfaceServer){
		super();
		
		this.server = interfaceServer;
		this.ws = ws;
		this.connMeta = ws._socket.address(); //{ address: '127.0.0.1', family: 'IPv4', port: 25543 }
		this.authenticated = false;
		this.token = null;
		
		this.lastHeartBeat = 0;
		
		this.heartbeatWaiter = null;
		
		this.temp = {};
		
		ws.on("error", err => this.server.wss.eventClientError(this, err));
		ws.on("close", (code, message) => this.server.wss.eventClientClose(this, code, message));
		ws.on("message", (data, flags) => this.server.wss.eventClientMessage(this, data, flags));

	}
	
	in(array){
		return array.indexOf(this) > -1;
	}
	
	_send(packet){
		if(this.ws.readyState === WebSocket.OPEN){
			this.server.messaging.sendTo(this.ws, packet);
			return true;
		}else{
			return false;
		}
	}
	
	send(type, data){
		this._send({t: "custom_" + type, d: data||{}});
	}
	
	get meta(){
		return {
			uuid : this.uuid
		}
	}
	
	disconnect(reason, code, extra){
		
		var d = {reason};
		
		if(extra){
			d.extra = extra;
		}
		
		clearTimeout(this.heartbeatWaiter);
		this._send({
			t : "disconnect", d
		});
		
		this.temp.dc_reason = reason;
		
		this.ws.close(code || 1000);
		this.removeInternally();
	}
	
	setHeartbeatListener(time){
		
		if(this.heartbeatWaiter){
			clearTimeout(this.heartbeatWaiter);
		}
		
		this.heartbeatWaiter = setTimeout(
			() => this.disconnect("no_heartbeat"),
			time + 15000 // allow for 15 second lateness
		);
	}
	
	removeInternally(){
		return this.server.wss.removeClient(this);
	}
}

module.exports = LucidClient;