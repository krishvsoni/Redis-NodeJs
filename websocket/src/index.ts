import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const wss = new WebSocketServer({ port: 8080 });

interface User {
  id: string;
  ws: WebSocket;
}

const users: Record<string, User> = {};
const subscribers: Record<string, Set<string>> = {};

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const userId = data.id;

      if (!users[userId]) {
        users[userId] = { id: userId, ws };
        console.log(`User ${userId} connected.`);
      }

      if (!subscribers[userId]) {
        subscribers[userId] = new Set();
      }

      subscribers[userId].add(userId);

      ws.send(JSON.stringify({ message: `Subscribed to events for user ${userId}` }));
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    for (const userId in users) {
      if (users[userId].ws === ws) {
        console.log(`User ${userId} disconnected.`);
        delete users[userId];
        delete subscribers[userId];
        break;
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function publishEvent(userId: string, event: any) {
  const userSubscribers = subscribers[userId];
  if (userSubscribers) {
    userSubscribers.forEach((subscriberId) => {
      const user = users[subscriberId];
      if (user) {
        try {
          user.ws.send(JSON.stringify(event));
        } catch (error) {
          console.error('Error sending event:', error);
        }
      }
    });
  }
}

setInterval(() => {
  const event = { event: 'new_event', data: `Data at ${new Date().toISOString()}` };
  for (const userId in subscribers) {
    publishEvent(userId, event);
  }
}, 5000);

console.log('WebSocket server is running on ws://localhost:8080');
