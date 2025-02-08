const WebSocket = require('ws');

class WebSocketManager {
  constructor(server) {
    this.server = server;
    this.wsRoutes = [];
    try {
      this.wss = new WebSocket.Server({ server: this.server });
      this.wss.on('connection', (ws, req) => {
        const route = this.wsRoutes.find(r => r.path === req.url);
        if (route && typeof route.onConnection === 'function') {
          try {
            route.onConnection(ws, req);
          } catch (error) {
            console.error('WebSocketManager onConnection Error:', error);
          }
        } else {
          console.log(`WebSocketManager: No handler for ${req.url}. Closing connection.`);
          ws.close();
        }
      });
    } catch (error) {
      console.error('WebSocketManager Initialization Error:', error);
      throw error;
    }
  }
  registerWebSocket(route) {
    try {
      this.wsRoutes.push(route);
      console.log(`WebSocketManager: Registered WebSocket route ${route.path}.`);
    } catch (error) {
      console.error('WebSocketManager.registerWebSocket Error:', error, 'Route:', route);
    }
  }
}

module.exports = WebSocketManager;
