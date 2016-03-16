/* global Buffer */
"use strict";

const WebSocketServer = require("ws").Server;
const Client = require("../structures/LucidClient");
const LimboClient = require("../structures/LucidLimboClient");
const md5Hex = require("md5-hex");
const Status = require("../util/constants").Status;
const crypto = require("crypto");

const protocol_v = require("../lucid-server").protocol_v;

const RawPackets = {
	MAX_CONNS: "{'t':'disconnect','d':{'reason':'core.maxConnections'}}"
};

function byteLength(res) {
	return Buffer.byteLength(res, "utf8");
}

class LucidWebSocketServer extends WebSocketServer {

	constructor(options, interfaceServer) {
		super(options);

		this.wrapper = interfaceServer;

		this.connections = [];

		this.timeoutWaits = [];

		this.on("error", error => this.eventError(error));
		this.on("connection", connection => this.eventConnection(connection));

	}

	renewClient(limbo, client, sequence) {
		client.ws = limbo.ws;
		client.status = Status.AVAILABLE;

		var heartbeat_interval = this.wrapper.options.heartbeat_interval, toSend = [], tooMany = false;

		// if the client has missed more messages than are allowed and there is
		// no listener to handle it then disconnect
		if (this.wrapper.options.send_missed_on_reconnect && sequence !== -1) {
			if (sequence - client.sequence > this.wrapper.options.max_return_queue) {
				if (client.hasListener("missTooManyPackets") || this.wrapper.hasListener("clientMissTooManyPackets")) {
					tooMany = true;
				} else {
					limbo.kill("core.requestTooManyReturnPackets");
					return;
				}
			} else if (this.wrapper.options.send_missed_on_reconnect && sequence !== -1) {
				// requesting packets and it meets the limit
				var messages = Array.prototype.slice.call(client.queue).reverse();
				for (let msg of messages) {
					if (msg.s >= sequence) {
						toSend.unshift(JSON.stringify(msg));
					} else {
						break;
					}
				}

				client.queue = [];
			}
		}

		client._send({
			t: "authenticated",
			d: {
				uuid: client.uuid,
				token: client.token,
				heartbeat_interval,
				reconnect_packets: this.wrapper.options.send_missed_on_reconnect
			}
		});

		if (sequence !== -1) {
			if (tooMany) {
				client.emit("missTooManyPackets");
				this.wrapper.emit("clientMissTooManyPackets", client);
			} else if (this.wrapper.options.send_missed_on_reconnect) {
				client._send({
					t: "returnPackets",
					d: {
						allowed: true,
						packets: toSend
					}
				});
			} else {
				client._send({
					t: "returnPackets",
					d: {
						allowed: false,
						packets: []
					}
				});
			}
		}

		// if heartbeat is enabled, only then start using it with the client
		if (heartbeat_interval > -1) {
			client.setHeartbeatListener(heartbeat_interval);
		}

		client.emit("reconnect");
		this.wrapper.emit("clientReconnect", client);
	}

	authNewClient(limbo, uuid) {
		var client = new Client(limbo.ws, this.wrapper);
		client.authenticated = true;
		client.uuid = uuid;
		client.token = crypto.randomBytes(32).toString("hex");
		this.connections.push(client);

		var heartbeat_interval = this.wrapper.options.heartbeat_interval;

		client._send({
			t: "authenticated",
			d: {
				uuid: client.uuid,
				token: client.token,
				heartbeat_interval,
				reconnect_packets: false
			}
		});

		// if heartbeat is enabled, only then start using it with the client
		if (heartbeat_interval > -1) {
			client.setHeartbeatListener(heartbeat_interval);
		}

		client.emit("connect");
		this.wrapper.emit("clientConnect", client);
	}

	eventError(error) {
		this.wrapper.emit("error", error);
	}

	eventConnection(connection) {

		var limboClient = new LimboClient(connection, this.wrapper);

	}

	eventClientError(client, error) {
		client.emit("error", error);
		this.wrapper.emit("clientError", client, error);
		client.disconnectNoReturn("error");
	}

	eventClientClose(client, code, message) {
		var reason = client.temp.dc_reason;
		var returning = client.canReturn;
		if (returning) {
			// disable client
			client.clean();
			client.status = Status.UNAVAILABLE;

			this.timeoutWaits.push(setTimeout(() => {
				if (client.status !== Status.AVAILABLE) {
					client.disconnectNoReturn("core.noReturnAfterLeave");
				}
			}, this.wrapper.options.reconnect_max_wait_time));

			client.emit("unavailable", reason, code, message);
			this.wrapper.emit("clientUnavailable", client, reason, code, message);
		} else {
			client.disconnectNoReturn(reason);
		}

	}

	eventClientMessage(client, data, flags) {
		var packet = null;
		var heartbeat_interval = this.wrapper.options.heartbeat_interval;
		try {
			packet = JSON.parse(data);
			if (!packet.t) {
				client.disconnectNoReturn("core.malformedPacket");
				return;
			}
		} catch (e) {
			client.disconnect("core.malformedPacket");
			return;
		}

		packet.d = packet.d || {};

		// for connections that have already gone through the auth process
		switch (packet.t) {
			case "heartbeat":
				client.setHeartbeatListener(heartbeat_interval);
				break;
			case "disconnect":
				// see if reason is less than 64 bytes, as we are storing the data server
				// side we don't want messages that are too big. revise
				if (byteLength(packet.d.reason) < 64) {
					client.temp.dc_reason = packet.d.reason;
				} else {
					client.disconnectNoReturn("core.disconnectMessageTooLarge");
				}
				break;
			default:
				if (packet.t.startsWith("custom_")) {
					// custom packets
					var type = packet.t.substr(7);
					client.emit("message", type, packet.d);
					this.wrapper.emit("clientMessage", client, type, packet.d);
				}
				break;
		}
	}

	removeClient(client) {
		var index = this.connections.indexOf(client);
		if (index > -1) {
			this.connections.splice(index, 1);
			return true;
		}
		return false;
	}
}

module.exports = LucidWebSocketServer;