# LucidClient

## Class: LucidClient

This class is used to represent a Client of the server. They are not necessarily active, as they may be temporarily disconnected. It is an `EventEmitter`.


## Instantiation

Clients are created by the [`LucidServer`](./LucidServer.md), developers should not instantiate Clients themselves.

-------

## Properties

* `server` [LucidServer](./LucidServer.md)
* `ws` [ws.WebSocket](https://github.com/websockets/ws/blob/master/doc/ws.md#class-wswebsocket)
* `authenticated` Boolean
* `uuid` String
* `lastHeartBeat` Number
* `queue` Array<Object>
* `sequence` Number
* `status` Number

#### `client.server`
The [LucidServer](./LucidServer.md) that the Client is a member of.

#### `client.ws`
The WebSocket connection of the Client. This may change upon reconnects.

#### `client.authenticated`
`true` if the Client has been authenticated by the [LucidServer](./LucidServer.md).

#### `client.uuid`
The _Universally unique identifier_ of the Client.

#### `client.lastHeartBeat`
Unix timestamp of when the last heart beat from the Client was received. If no heartbeats have been received yet, this is `0`.

#### `client.queue`
An Array of packets that should've been sent to the client but for whatever reason didn't send. A reconnect of a client will force this queue to be sent.

#### `client.status`
Status of the client. If the client is available and in an active session, this will be `1`. If the client is temporarily unavailable (i.e. not connected right now, but may return soon) then this will be `2`.

--------

## Methods

#### `client.in(array)`
* `array` Array
* **returns** Boolean

Returns `true` if the Client is present in the given array. This is tested using `array.indexOf(client)`.

#### `client.send(type, data)`
* `type` String
* `data` Object

Sends a packet to the Client if it is connected.

#### `client.sendRaw(data)`
* `data` String

Sends the unmodified data to the Client's WebSocket.

#### `client.disconnectWithReturn(reason, [extra])`
* `reason` String
* `extra` Object

Sends a `disconnect` packet to the Client but allows it to renew its session upon reconnection.

#### `client.disconnectNoReturn(reason, [extra])`
* `reason` String
* `extra` Object

Sends a `disconnect` packet to the Client and ends its session, terminating it.


--------

## Events

#### `connected()`

Emitted when the Client is connected.

#### `error(error)`
* `error` Error

Emitted when the Client experiences an error.

#### `close(reason, code, message)`
* `reason` String
* `code` Number
* `message` String

Emitted when the Client is closed. If no reason was specified (unexpected closure) then it will be null.

#### `message(type, data)`
* `type` String
* `data` Object

Emitted when the Client sends a message to the Server.

#### `missTooManyPackets()`

Emitted when the Client reconnects to the server but asks for too many packets to be sent to it. If neither this listener or `clientMissTooManyPackets` is listened for on the server, then the client will be disconnected. Otherwise, the events will be fired allowing you to choose what happens.

#### `reconnect()`

Emitted when the Client reconnects to the server.