var LucidServer = require("../");
var WebSocket = require("ws");

var server = new LucidServer();

var ws = new WebSocket("ws://127.0.0.1:25543/ws");
ws.onerror=()=>{};

var uuid, token, _client;

server.on("clientClose", (client, reason) => {
	console.log("server.client.close", reason);
});

server.on("clientMissedTooManyPackets", client => {
	console.log(":()");
})

server.on("clientConnect", client => {

	_client = client;

	console.log("length", server.clients.length);

	client.on("message", (type, data) => {
		console.log(type, data);
	});

	client.send("test");
});

ws.onopen = e => {
    console.log("open");
    ws.send(`{"t":"new_auth","d":{"protocol_v":"alpha3"}}`);
}
ws.on("message", m => {

	console.log(m);

	var packet = JSON.parse(m);

	switch (packet.t) {
		case "authenticated":
			uuid = packet.d.uuid;
			token = packet.d.token;
			break;
		case "custom_test":
			//ws.close();
			break;
	}
})

ws.on("close", e => {
	console.log("client.close", e);
	console.log("length", server.clients.length);

	_client.send("hello");
});

function startWS2() {
	console.log(_client.queue);
	var ws = new WebSocket("ws://127.0.0.1:25544");
	ws.onopen = e => {
		console.log("open");
		ws.send(JSON.stringify({ "t": "existing_auth", "d": { "protocol_v": "alpha3", token: token, s:2 } }));
	}
	ws.on("message", m => {
		console.log(m);
		var packet = JSON.parse(m);
		switch (packet.t) {
			case "authenticated":
				uuid = packet.d.uuid;
				break;
		}
	})

	ws.on("close", e => {
		console.log("client.close", e);
		console.log("length", server.clients.length);
		var ws2 = new WebSocket("ws://127.0.0.1:25544");
	});
}