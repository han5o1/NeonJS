# NeonJS Wiki

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
  - [Engine](#engine)
  - [SecurityManager](#securitymanager)
  - [Auth](#auth)
  - [Router](#router)
  - [WebSocketManager](#websocketmanager)
  - [DatabaseManager](#databasemanager)
  - [RateLimiter](#ratelimiter)
  - [Logger](#logger)
  - [SessionManager](#sessionmanager)
  - [Interpreter](#interpreter)
- [YAML Configuration](#yaml-configuration)
- [Plugin Development](#plugin-development)
- [Contributing](#contributing)
- [License](#license)

## Overview
**NeonJS** is a lightweight, component-based backend framework built entirely using Node.js core modules—without relying on Express. It provides advanced security features, built-in JWT authentication, rate limiting, session management, WebSocket support, and a flexible plugin system. All configuration is done via YAML files.

## Features
- **Custom HTTP Engine:** Implements a middleware chain using Node.js's native `http` module.
- **Enhanced Security:** Sets advanced HTTP security headers and includes a robust JSON body parser.
- **JWT Authentication:** Built-in support for token generation and middleware-based authentication.
- **Dynamic Routing:** Supports static routes and parameterized routes (e.g., `/products/:id`).
- **WebSocket Support:** Integrated WebSocket handling via the `ws` module.
- **Rate Limiting:** User-configurable rate limiter to prevent request flooding.
- **Request Logging:** Logs each request’s timestamp, method, URL, response status, and duration.
- **Session Management:** Simple cookie-based session management.
- **Plugin System:** Easily extend the framework with custom plugins (e.g., e-commerce functionalities).
- **YAML-Based Configuration:** All routes, WebSocket endpoints, plugins, and (optionally) database configurations are defined in YAML.

## Folder Structure
```
/neonjs
  ├── /core
  │      ├── Engine.js              // Custom HTTP server & middleware engine
  │      └── SecurityManager.js     // Enhanced security middleware
  ├── /components
  │      ├── Auth.js                // JWT-based authentication
  │      ├── Router.js              // Custom router with parameter support
  │      ├── WebSocketManager.js    // WebSocket route management using ws
  │      ├── DatabaseManager.js     // (Optional) Database connection & migration
  │      ├── RateLimiter.js         // Request rate limiting (user-configurable)
  │      ├── Logger.js              // Request logging middleware
  │      └── SessionManager.js      // Cookie-based session management middleware
  ├── /scripts
  │      └── Interpreter.js         // YAML configuration parser & route/plugin registration
  ├── /examples
  │      ├── /handlers             // Sample handler modules (e.g., login, ws)
  │      ├── /plugins              // Sample plugin modules (samplePlugin, shoppingMallPlugin)
  │      ├── setting.yaml           // Full configuration file (with databases, etc.)
  │      └── test_setting.yaml      // Test configuration (without database settings)
  ├── test.js                      // Internal test script for all features
  ├── .env                         // Environment variables (PORT, AUTH_SECRET, etc.)
  ├── index.js                     // NeonJS class definition (for external usage)
  └── package.json                 // Project dependencies and scripts
```

## Installation
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your_username/NeonJS.git
   cd NeonJS
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Set Up Environment Variables:**  
   Create a `.env` file in the project root:
   ```dotenv
   PORT=3000
   AUTH_SECRET=super_secret_key_123
   ```

## Getting Started
### Running Internal Tests
NeonJS includes a test script (`test.js`) that uses the test YAML configuration (`/examples/test_setting.yaml`) to start the server on port 4000 and test HTTP routes, WebSocket endpoints, rate limiting, and plugins.

Run the tests with:
```bash
node test.js
```

### Using NeonJS in Your Own Project
Import and instantiate NeonJS with your configuration file:
```javascript
// app.js example
const NeonJS = require('neonjs');

(async () => {
  const app = new NeonJS({
    nsPath: __dirname + '/config/your_setting.yaml', // Your YAML config file or directory
    port: 4000,
    autoLoad: true,
    rateLimiterOptions: { windowMs: 60000, maxRequests: 50, errorMessage: 'Rate limit exceeded' },
    sessionOptions: { cookieName: 'my_session' }
  });
  await app.start();
})();
```

## API Reference

### Engine
- **Description:**  
  Provides the custom HTTP server and middleware engine.
- **Methods:**
  - `new Engine()`  
    Creates an Engine instance with an internal `Application` that maintains a middleware chain.
  - `engine.app.use(fn)`  
    Registers a middleware function.
  - `engine.start(port)`  
    Starts the HTTP server on the given port.
- **Usage Example:**
  ```javascript
  const Engine = require('./core/Engine');
  const engine = new Engine();
  engine.app.use((req, res, next) => { console.log('Request received'); next(); });
  engine.start(3000);
  ```

### SecurityManager
- **Description:**  
  Sets advanced HTTP security headers and includes a JSON body parser with error handling.
- **Usage Example:**
  ```javascript
  const SecurityManager = require('./core/SecurityManager');
  const engine = new (require('./core/Engine'))();
  const secManager = new SecurityManager(engine.app);
  secManager.init();
  engine.start(3000);
  ```

### Auth
- **Description:**  
  Provides JWT-based token generation and authentication middleware.
- **Methods:**
  - `generateToken(payload, expiresIn)`  
    Generates a JWT token.
  - `authenticate()`  
    Returns a middleware function that verifies the token.
- **Usage Example:**
  ```javascript
  const Auth = require('./components/Auth');
  const auth = new Auth('your_secret_key');
  const token = auth.generateToken({ username: 'test' });
  // Use auth.authenticate() as a middleware in routes.
  ```

### Router
- **Description:**  
  Registers HTTP routes, supports parameterized routes, and wraps handlers with authentication if required.
- **Methods:**
  - `registerRoute(route)`  
    Registers a new route.
  - `middleware(req, res, next)`  
    Matches the incoming request with a registered route and calls its handler.
- **Usage Example:**
  ```javascript
  const Router = require('./components/Router');
  const Auth = require('./components/Auth');
  const auth = new Auth('your_secret_key');
  const router = new Router(auth);
  router.registerRoute({
    method: "GET",
    path: "/hello",
    response: { type: "json", data: { message: "Hello World" } }
  });
  // In your Engine, add: engine.app.use(router.middleware.bind(router));
  ```

### WebSocketManager
- **Description:**  
  Manages WebSocket routes using the `ws` module.
- **Methods:**
  - `registerWebSocket(route)`  
    Registers a new WebSocket route.
- **Usage Example:**
  ```javascript
  const WebSocketManager = require('./components/WebSocketManager');
  const engine = new (require('./core/Engine'))();
  const wsManager = new WebSocketManager(engine.server);
  wsManager.registerWebSocket({
    path: '/ws',
    onConnection: (ws, req) => {
      ws.send('Welcome to WebSocket!');
    }
  });
  engine.start(3000);
  ```

### DatabaseManager
- **Description:**  
  (Optional) Manages database connections and migrations.
- **Usage:**  
  Typically used via YAML configuration. (Not detailed here as test_setting.yaml omits database settings.)

### RateLimiter
- **Description:**  
  Limits the number of requests per client based on a configurable time window.
- **Options:**  
  - `windowMs`: Time window in milliseconds (default: 60000).
  - `maxRequests`: Maximum allowed requests per window (default: 100).
  - `errorMessage`: Message returned when rate limit is exceeded.
  - `getKey(req)`: Function to extract a key (e.g., IP address) from the request.
- **Usage Example:**
  ```javascript
  const RateLimiter = require('./components/RateLimiter');
  const rateLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 50 });
  // Use as middleware: engine.app.use(rateLimiter.middleware.bind(rateLimiter));
  ```

### Logger
- **Description:**  
  Logs each request with a timestamp, HTTP method, URL, status code, and response time.
- **Usage Example:**
  ```javascript
  const Logger = require('./components/Logger');
  const logger = new Logger();
  // Register logger middleware: engine.app.use(logger.middleware.bind(logger));
  ```

### SessionManager
- **Description:**  
  Manages sessions using a simple cookie-based mechanism.
- **Options:**  
  - `cookieName`: Name of the session cookie (default: `neonjs_session`).
- **Usage Example:**
  ```javascript
  const SessionManager = require('./components/SessionManager');
  const sessionManager = new SessionManager({ cookieName: 'my_session' });
  // Use as middleware: engine.app.use(sessionManager.middleware.bind(sessionManager));
  ```

### Interpreter
- **Description:**  
  Reads a YAML configuration file and registers routes, WebSocket endpoints, databases, and plugins.
- **Usage Example:**
  ```javascript
  const Interpreter = require('./scripts/Interpreter');
  const Router = require('./components/Router');
  const WebSocketManager = require('./components/WebSocketManager');
  const DatabaseManager = require('./components/DatabaseManager');
  const auth = new (require('./components/Auth'))('your_secret');
  const router = new Router(auth);
  const wsManager = new WebSocketManager(/* your engine.server */);
  const dbManager = new DatabaseManager();
  const interpreter = new Interpreter(router, wsManager, dbManager);
  interpreter.interpret('./path/to/your_setting.yaml');
  ```

## YAML Configuration
NeonJS uses YAML to define all configuration elements.

### Example: test_setting.yaml
```yaml
routes:
  - method: GET
    path: /public
    response:
      type: json
      data:
        message: "This is a public route"
        
  - method: GET
    path: /secure
    authRequired: true
    response:
      type: json
      data:
        message: "Secure route accessed"
        
  - method: POST
    path: /login
    response:
      import:
        module: "./handlers/loginHandler.js"
        function: "loginHandler"

websockets:
  - path: /ws
    import:
      module: "./handlers/wsHandler.js"
      function: "wsHandler"

plugins:
  - import:
      module: "./plugins/samplePlugin.js"
      function: "initPlugin"
    options:
      pluginOption1: "value1"
      pluginOption2: "value2"
  - import:
      module: "./plugins/shoppingMallPlugin.js"
      function: "initShoppingMall"
    options:
      currency: "USD"
```
*Note: In the test configuration, the `databases` section is omitted.*

## Plugin Development
Plugins extend NeonJS functionality. A plugin is a module that exports a function (e.g., `initPlugin` or `initShoppingMall`) which receives a context object containing:
- `engine`: The HTTP server application.
- `router`: The Router instance.
- `wsManager`: The WebSocketManager instance.
- `dbManager`: The DatabaseManager instance.
- `options`: User-specified options.

### Example Plugin: Shopping Mall Plugin
```javascript
// examples/plugins/shoppingMallPlugin.js
module.exports.initShoppingMall = (context) => {
  try {
    // Register route for product listing
    context.router.registerRoute({
      method: "GET",
      path: "/products",
      response: {
        type: "json",
        data: {
          products: [
            { id: 1, name: "Product A", price: 10.0 },
            { id: 2, name: "Product B", price: 20.0 }
          ]
        }
      }
    });
    // Register route for product details (with parameter support)
    context.router.registerRoute({
      method: "GET",
      path: "/products/:id",
      response: {
        handler: (req, res) => {
          const productId = req.params.id;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ id: productId, name: `Product ${productId}`, price: parseFloat(productId) * 10 }));
        }
      }
    });
    // Route for adding an item to the cart
    context.router.registerRoute({
      method: "POST",
      path: "/cart",
      response: {
        type: "json",
        data: { message: "Item added to cart" }
      }
    });
    // Route for viewing the cart
    context.router.registerRoute({
      method: "GET",
      path: "/cart",
      response: {
        type: "json",
        data: { items: [] }
      }
    });
    // Route for checkout
    context.router.registerRoute({
      method: "POST",
      path: "/checkout",
      response: {
        type: "json",
        data: { message: "Checkout successful" }
      }
    });
    console.log("ShoppingMall Plugin: E-commerce routes registered.");
  } catch (error) {
    console.error("ShoppingMall Plugin Initialization Error:", error);
  }
};
```

## Contributing
1. Fork the repository.
2. Create a new branch for your changes.
3. Write tests and update documentation as needed.
4. Submit a pull request with a detailed description of your changes.

## License
NeonJS is licensed under the MIT License.

---

 
