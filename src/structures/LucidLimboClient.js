"use strict";

const WebSocket = require("ws");
const EventEmitter = require("events").EventEmitter;
const protocol_v = require("../lucid-server").protocol_v;
const md5Hex = require("md5-hex");
const Status = require("../util/constants").Status;

class LucidLimboClient extends EventEmitter {
	constructor(ws, interfaceServer) {
		super();

		this.server = interfaceServer;
		this.ws = ws;

		this.killTimeout = setTimeout(() => this.kill("core.noAuth"), this.server.options.response_max_wait_time);

		this.ws.once("message", (data, flags) => {
			if (flags.binary) {
				this.kill("core.limboClientsNoBinary");
				return;
			}

			var packet = null;
			try {
				packet = JSON.parse(data);
				if (!packet.t) {
					this.kill("core.noPacketType");
				}
			} catch (e) {
				this.kill("core.malformedPacket");
				return;
			}

			packet.d = packet.d || {};

			if (!(packet.d.protocol_v && packet.d.protocol_v === protocol_v)) {
				this.kill("core.differentProtocol", { expected: protocol_v });
				return;
			}

			switch (packet.t) {
				case "new_auth":
					var uuid;
					while (true) {
						uuid = md5Hex(`${Date.now() }-${Math.random() * 1000000} }`);
						for (let client of this.server.connections) {
							if (client.uuid === uuid) {
								continue;
							}
						}
						break;
					}
					clearTimeout(this.killTimeout);
					this.server.wss.authNewClient(this, uuid);
					break;
				case "existing_auth":
					clearTimeout(this.killTimeout);
					if (!packet.d.token) {
						this.kill("core.requestReturnWithoutToken");
						return;
					}

					// if sequence not provided
					if(!packet.d.s){
						this.kill("core.requestReturnWithoutSequence");
						return;
					}

					for (let client of this.server.connections) {
						if (client.token === packet.d.token) {
							if (client.status === Status.AVAILABLE) {
								this.kill("core.requestReturnSessionAlreadyActive");
							} else if (!client.canReturn) {
								this.kill("core.requestReturnDisallowed");
							} else {
								this.server.wss.renewClient(this, client, packet.d.s);
							}
							return;
						}
					}

					this.kill("core.requestReturnNotFound");

					break;
				default:
					this.kill("core.unsupportedMessageType");
					break;
			}

		});
	}

	kill(reason, extra, canReturn) {
		extra = extra || {};
		extra.return = canReturn;

		var d = {
			reason: reason,
			extra: extra
		};

		this.send({
			t: "disconnect",
			d
		});

		this.ws.close();
	}

	send(packet) {
		if (this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(packet));
			return;
		} else {
			return false;
		}
	}
}

module.exports = LucidLimboClient;