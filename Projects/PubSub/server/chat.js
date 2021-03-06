class Chat {
  constructor() {
    this.clients = new Set();
  }

  add(client) {
    this.clients.add(client);
  }

  message(serializedMessage) {
    const { sender_id, message, id, pubSource } = this.deserialize(serializedMessage);

    console.log('message', id, pubSource);

    this.clients.forEach(client => {
      const from = id || (client.id === sender_id ? 'me:' : 'them:');
      console.log('message', from);

      client.send(`${from} ${message}`);
    });
  }

  serialize(obj) {
    if (typeof obj === 'string') {
      return obj;
    }

    return JSON.stringify(obj);
  }

  deserialize(obj) {
    if (typeof obj === 'string') {
      return JSON.parse(obj);
    }

    return obj;
  }
}

exports.default = Chat;