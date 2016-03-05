# LucidGroup

## Class: LucidGroup

LucidGroups are used to organise clients and act as "channels" for messages to be sent in. LucidGroups are anonymous - clients of the group are not aware they are part of the group.

## Instantiation
```js
var group = lucid_server.createGroup(options, members);
```
_See the [`LucidServer.createGroup(...)`](https://github.com/lucid-ws/lucid-server/blob/indev-docs/docs/LucidServer.md#servercreategroupoptions-members) docs for more information._

-------

## Properties

* `server` [LucidServer](./LucidServer.md)
* `clients` Array<[LucidClient](./LucidClient.md)>
* `uuid` String
* `options` Object

#### `group.server`
The LucidServer that the group belongs to.

#### `group.clients`
The clients in the group.

#### `group.uuid`
The _Universally unique identifier_ for the group.

#### `group.options`
An object containing the following optional properties to configure the group:

```js
{}
```

--------

## Methods

#### `group.addClient(client)`
* `client` [LucidClient](./LucidClient.md)
* **returns** Boolean

Adds a client to the group. Returns `true` if the client was added, `false` if they were already in the group.

#### `group.addClients(clients)`
* `clients` Array<[LucidClient](./LucidClient.md)>

Adds multiple clients to the group.

#### `group.removeClient(client)`
* `client` [LucidClient](./LucidClient.md)
* **returns** Boolean

Removes a client from the group. Returns `true` if the client was removed, `false` if they weren't already in the group.

#### `group.removeClients(clients)`
* `clients` Array<[LucidClient](./LucidClient.md)>

Remove multiple clients from the group.

#### `group.broadcast(type, data)`
* `type` String
* `data` Object

Sends a packet to all available clients in the group.

#### `group.broadcastExcept(type, data, exceptions)`
* `type` String
* `data` Object
* `exceptions` Array<[LucidClient](./LucidClient.md)>

Sends a packet to all available clients in the group except from the ones given in the exceptions array.

#### `group.broadcastRaw(data)`
* `data` String

Sends the unmodified given data directly to the websockets of the clients of the group.

#### `group.broadcastRawExcept(data, exceptions)`
* `data` String

Sends the unmodified given data directly to the websockets of the clients of the group, except from the ones given in the exceptions array.
