const http = require('http');

class Application {
  constructor() {
    this.middlewares = [];
  }
  use(fn) {
    this.middlewares.push(fn);
  }
  handleRequest(req, res) {
    let index = 0;
    const next = (err) => {
      if (err) {
        console.error('Middleware error:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }
      const middleware = this.middlewares[index++];
      if (!middleware) {
        if (!res.writableEnded) res.end();
        return;
      }
      try {
        middleware(req, res, next);
      } catch (error) {
        next(error);
      }
    };
    next();
  }
}

class Engine {
  constructor() {
    this.app = new Application();
    this.server = http.createServer((req, res) => {
      this.app.handleRequest(req, res);
    });
  }
  start(port) {
    try {
      this.server.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    } catch (error) {
      console.error('Engine.start Error:', error);
      throw error;
    }
  }
}

module.exports = Engine;
