"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const protocol_v = require("../lucid-server").protocol_v;
const cors = require("cors");

class LucidApp {
	constructor(wrapper) {

		this.wrapper = wrapper;

		var app = this.app = express();
		var customRouter = this.customAPIRouter = express.Router();
		var internalAPIRouter = this.internalAPIRouter = express.Router();

		app.use(cors());

		internalAPIRouter.get("/meta", (req, res) => {
			res.json({
				wss_port: this.wrapper.options.port,
				protocol_v,
				connections: this.wrapper.wss.connections.length,
				max_connections: this.wrapper.options.max_connections
			});
		});
		customRouter.use((req, res, next) => this.verifyIfUser(req, res, next));
		customRouter.use(bodyParser.urlencoded({ extended: false }));
		customRouter.use(bodyParser.json());

		app.use("/custom_api", customRouter);
		app.use("/api", internalAPIRouter);

		app.listen(this.wrapper.options.api_port);
	}

	verifyIfUser(req, res, next) {
		if (req.headers["token"]) {
			var connections = this.wrapper.wss.connections.filter(conn => conn.uuid === req.headers["token"]);
			if (connections.length === 1) {
				var client = connections[0];
				req.client = client;
				next();
				return;
			}
		}

		res.status(403);
		res.json({
			message: "You are not authenticated on this server"
		});
		res.end();
	}
}

module.exports = LucidApp;