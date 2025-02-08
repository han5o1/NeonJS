const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

class Interpreter {
  /**
   * @param {Router} router - Instance for registering HTTP routes
   * @param {WebSocketManager} wsManager - Instance for registering WebSocket routes
   * @param {DatabaseManager} dbManager - Instance for database registration/migration
   */
  constructor(router, wsManager, dbManager) {
    this.router = router;
    this.wsManager = wsManager;
    this.dbManager = dbManager;
  }
  async interpret(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const config = yaml.load(fileContent);
      const yamlDir = path.dirname(filePath);

      // Register HTTP routes
      if (Array.isArray(config.routes)) {
        config.routes.forEach(route => {
          try {
            if (route.response && route.response.import) {
              const importInfo = route.response.import;
              const modulePath = path.resolve(yamlDir, importInfo.module);
              const importedModule = require(modulePath);
              const funcName = importInfo.function;
              route.response.handler = funcName ? importedModule[funcName] : importedModule;
            }
            route.response._yamlFile = filePath;
            this.router.registerRoute(route);
          } catch (error) {
            console.error('Interpreter Route Registration Error:', error, 'Route:', route);
          }
        });
      }
      if (Array.isArray(config.websockets)) {
        config.websockets.forEach(wsRoute => {
          try {
            if (wsRoute.import) {
              const importInfo = wsRoute.import;
              const modulePath = path.resolve(yamlDir, importInfo.module);
              const importedModule = require(modulePath);
              const funcName = importInfo.function;
              wsRoute.onConnection = funcName ? importedModule[funcName] : importedModule;
            }
            this.wsManager.registerWebSocket({
              path: wsRoute.path,
              onConnection: wsRoute.onConnection
            });
          } catch (error) {
            console.error('Interpreter WebSocket Registration Error:', error, 'WebSocket Route:', wsRoute);
          }
        });
      }

      // Register databases and migrations
      if (Array.isArray(config.databases)) {
        for (const dbConfig of config.databases) {
          await this.dbManager.registerDatabase(dbConfig);
        }
      }

      // Load plugins
      if (Array.isArray(config.plugins)) {
        config.plugins.forEach(plugin => {
          try {
            if (plugin.import) {
              const importInfo = plugin.import;
              const modulePath = path.resolve(yamlDir, importInfo.module);
              const importedModule = require(modulePath);
              const funcName = importInfo.function;
              const pluginFunction = funcName ? importedModule[funcName] : importedModule;
              const options = plugin.options || {};
              pluginFunction({
                engine: this.router.app,
                router: this.router,
                wsManager: this.wsManager,
                dbManager: this.dbManager,
                options: options
              });
              console.log(`Interpreter: Plugin from module ${importInfo.module} loaded.`);
            }
          } catch (error) {
            console.error('Interpreter Plugin Loading Error:', error, 'Plugin:', plugin);
          }
        });
      }
    } catch (err) {
      console.error('Interpreter Error:', err);
    }
  }
}

module.exports = Interpreter;
