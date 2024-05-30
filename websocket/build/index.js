"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const users = {};
const subscribers = {};
wss.on('connection', (ws) => {
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
        }
        catch (error) {
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
function publishEvent(userId, event) {
    const userSubscribers = subscribers[userId];
    if (userSubscribers) {
        userSubscribers.forEach((subscriberId) => {
            const user = users[subscriberId];
            if (user) {
                try {
                    user.ws.send(JSON.stringify(event));
                }
                catch (error) {
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
