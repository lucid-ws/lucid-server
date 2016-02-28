var LucidServer = require("../");
var WebSocket = require("ws");

var server = new LucidServer();

var ws = new WebSocket("ws://127.0.0.1:25544");

var token;

server.on("clientClose", (client, reason)=>{
	console.log("server.client.close", reason);
});

server.on("clientConnected", client => {
	
	console.log("length", server.clients.length);
	
	client.on("message", (type, data) => {
		console.log(type, data);
	});
	
	client.send("test");
});

ws.onopen = e => {
    console.log("open");
    ws.send(`{"t":"new_auth","d":{"protocol_v":"alpha2"}}`);
}
ws.on("message", m => {
	
	console.log(m);
	
	var packet = JSON.parse(m);
	
	switch(packet.t){
		case "authenticated":
			token = packet.d.token;
			break;
	}
})

ws.on("close", e => {
	console.log("client.close", e);
});