# LucidClient

## Class: LucidClient

This class is used to represent a Client of the server. They are not necessarily active, as they may be temporarily disconnected. It is an `EventEmitter`.


## Instantiation

Clients are created by the `[LucidServer](./LucidServer.md)`, developers should not instantiate Clients themselves.

-------

## Properties

* `server` [LucidServer](./LucidServer.md)
* `ws` [ws.WebSocket](https://github.com/websockets/ws/blob/master/doc/ws.md#class-wswebsocket)
* `authenticated` Boolean
* `uuid` String
* `lastHeartBeat` Number

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

#### `client.disconnect(reason, code, [extra])`
* `reason` String
* `code` Number
* `extra` Object

Sends a `disconnect` packet to the Client and then terminates the connection to it.