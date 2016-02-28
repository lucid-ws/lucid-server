# Lucid Server
Simple and lightweight Lucid server for use with node.js.

```js
var LucidServer = require("lucid-ws/lucid-server");

var server = new LucidServer();
server.on("clientConnected", client => {
	
	// send message packet with message of hello
	client.send("message", {message:"hello!"});

});
```