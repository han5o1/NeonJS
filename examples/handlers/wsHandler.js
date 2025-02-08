module.exports.wsHandler = (ws, req) => {
    try {
      console.log("WebSocket connected on /ws (imported handler)");
      ws.send(JSON.stringify({ message: "Welcome to NeonJS secure WebSocket!" }));
      ws.on('message', (message) => {
        console.log("Received message:", message);
        ws.send("Echo: " + message);
      });
    } catch (error) {
      console.error('wsHandler Error:', error);
    }
  };
  