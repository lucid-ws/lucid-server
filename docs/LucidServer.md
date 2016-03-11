# LucidServer
### `protocol alpha3`

## Class: LucidServer

```js
const LucidServer = require("lucid-server")
```

This class is a LucidServer. It is an `EventEmitter`.

## Constructor
### new LucidServer([options])

* `options` Object
	* `port` Number
	* `max_connections` Number
	* `response_max_wait_time` Number
	* `lenient` Boolean
	* `hearbeat_interval` Number
	* `reconnect_max_wait_time` Number
	* `max_return_queue` Number
	* `send_missed_on_reconnect` Boolean

#### `options.port`
Defaults to _25543_. The port that the server should listen on.

#### `options.max_connections`
Defaults to _10_. The maximum amount of WebSocket connections that the server should manage. This factors in temporarily disconnected clients.

#### `options.response_max_wait_time`
Defaults to `5000`. This is how long the WebSocket client has upon connection to make their authorisation request.

#### `options.lenient`
Defaults to `false`. If `true`, the server will not terminate clients that send unexpected/malformed packets.

#### `options.heartbeat_interval`
Defaults to `30000`. The interval in milliseconds that clients are expected to send a heartbeat packet. To disable heartbeats, set to `-1`.

#### `options.reconnect_max_wait_time`
Defaults to `300000` (5 minutes). The time in milliseconds that a client is allowed to be disconnected until it its session expires. Set to `-1` if you want to disable client reconnects.

#### `options.max_return_queue`
Defaults to `100`. Redundant if `options.send_missed_on_reconnect` is false. Specifies how many packets a client can miss during a disconnection until its session expires.

### `options.send_missed_on_reconnect`
Defaults to `true`. If `true`, the server will send packets that the client has missed during a disconnection after it reconnects.

-------

## Properties

* `options` : Object
* `clients` : Array<[Lucid.Client](./LucidClient.md)>
* `groups` : Array<[Lucid.Group](./LucidGroup.md)>
* `api` : [express.Router](http://expressjs.com/en/4x/api.html#router)

#### `server.options`
See [Constructor](#constructor) for example of options object.

#### `server.clients`
An array of the clients connected or temporarily disconnected to the server.

#### `server.groups`
An array of the messaging groups created.

#### `server.api`
An Express Router to allow you to make your own HTTP API. The Router has middleware that only allows authorised clients.

--------

## Methods

#### `server.createGroup([options, members])`
* `options` Object (see [LucidGroup](./LucidGroup.md) for specification)
* `members` Array<[LucidClient](./LucidClient.md)>
* **returns** [LucidGroup](./LucidGroup.md)

Creates a [LucidGroup](./LucidGroup.md) with the specified options and members.

#### `server.deleteGroup(group)`
* `group` [LucidGroup](./LucidGroup.md)
* **returns** Boolean

Deletes a [LucidGroup](./LucidGroup.md) and unregisters it. Returns `true` if the operation was successful.

#### `server.broadcast(type, data)`
* `type` String
* `data` Object

Turns the given type and data into a packet and sends it to all available clients.

#### `server.broadcastExcept(type, data, exceptions)`
* `type` String
* `data` Object
* `exceptions` Array<[LucidClient](./LucidClient.md)>

Broadcasts a packet to all available clients apart from those specified in the exceptions array.

--------

## Events

#### `error(error)`
* `error` Error

Emitted when an error occurs.

#### `clientError(client, error)`
* `client` [LucidClient](./LucidClient.md)
* `error` Error

Emitted when a client experiences an error.

#### `clientClose(client, reason, code, message)`
* `client` [LucidClient](./LucidClient.md)
* `reason` String
* `code` Number
* `message` String

Emitted when a client is permanently closed and its session has ended. If no reason was specified (unexpected closure) then it will be `null`.

#### `clientMessage(client, type, data)`
* `client` [LucidClient](./LucidClient.md)
* `type` String
* `data` Object

Emitted whenever a Client sends a custom (non-core) packet to the server.

#### `clientConnect(client, type)`
* `client` [LucidClient](./LucidClient.md)
* `type` String - either `new` or `reconnect`

Emitted whenever a Client connects to the server.

#### `clientMissTooManyPackets(client)`
* `client` [LucidClient](./LucidClient.md)

Emitted when a client reconnects and asks for missing packets, but it has missed too many (specified by `server.options.max_return_queue`). In this case, if a `clientMissTooManyPackets` event is registered to the server, or `missTooManyPackets` to the client, instead of disconnecting the client, the event is fired instead.

#### `clientReconnect(client)`
* `client` [LucidClient](./LucidClient.md)

Emitted when a client reconnects to the server.

#### `clientUnavailable(client, reason)`
* `client` [LucidClient](./LucidClient.md)
* `reason` String

Emitted when a client has disconnected, but its session is still kept alive for a time specified by `server.options.reconnect_max_wait_time`. After this time, a `clientClose` event will be fired.

