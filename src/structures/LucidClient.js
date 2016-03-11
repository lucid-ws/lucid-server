"use strict";

const WebSocket = require("ws");
const EventEmitter = require("events").EventEmitter;

const Status = require("../util/constants").Status;

class LucidClient extends EventEmitter {
	constructor(ws, interfaceServer) {
		super();

		this.server = interfaceServer;
		this.ws = ws;
		this.authenticated = false;
		this.uuid = null;

		this.lastHeartBeat = 0;

		this.heartbeatWaiter = null;

		this.temp = {};

		this._canReturn = true;

		this.queue = [];

		this.sequence = 0;

		// assume status is available since we are instantiating
		this.status = Status.AVAILABLE;

		ws.on("error", err => this.server.wss.eventClientError(this, err));
		ws.on("close", (code, message) => this.server.wss.eventClientClose(this, code, message));
		ws.on("message", (data, flags) => this.server.wss.eventClientMessage(this, data, flags));
	}

	in(array) {
		return array.indexOf(this) > -1;
	}

	_send(packet) {
		packet.s = this.sequence;
		this.sequence++;
		if (this.ws.readyState === WebSocket.OPEN) {
			this.server.messaging.sendTo(this.ws, packet, err => {
				if (err && packet.t !== "disconnect") {
					this.queue.push(packet);
				}
			});
			return true;
		} else {
			if (packet.t !== "disconnect")
				this.queue.push(packet);
			return false;
		}
	}

	sendRaw(data) {
		if (this.ws.readyState === WebSocket.OPEN) {
			this.server.messaging.sendToRaw(this.ws, data);
			return true;
		} else {
			return false;
		}
	}

	send(type, data) {
		this._send({ t: "custom_" + type, d: data || {} });
	}

	get meta() {
		return {
			uuid: this.uuid
		};
	}

	get canReturn() {
		// explicit no return
		if (!this._canReturn || this.server.options.reconnect_max_wait_time === -1)
			return false;

		return true;

	}

	clean() {
		clearTimeout(this.heartbeatWaiter);
		this.ws.close();
	}

	disconnectNoReturn(reason, extra) {
		extra = extra || {};
		this._canReturn = false;
		var d = { reason, extra };
		this._send({
			t: "disconnect",
			d
		});
		this._canReturn = false;
		this.clean();
		this.removeInternally();
		this.emit("disconnect", reason);
		this.server.emit("clientDisconnect", this, reason);
	}

	disconnectWithReturn(reason, extra) {
		extra = extra || {};
		this._canReturn = true;
		var d = { reason, extra };
		this._send({
			t: "disconnect",
			d
		});
		this._canReturn = true;
		this.clean();
	}

	setHeartbeatListener(time) {

		if (this.heartbeatWaiter) {
			clearTimeout(this.heartbeatWaiter);
		}

		this.heartbeatWaiter = setTimeout(
			() => this.disconnectWithReturn("core.noHeartbeat"),
			time + (1000 * 1) // allow for 30 second lateness
			);
	}

	hasListener(type){
		return this.listeners(type).length > 0;
	}

	removeInternally() {
		this.queue = [];
		return this.server.wss.removeClient(this);
	}
}

module.exports = LucidClient;