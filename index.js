require('dotenv').config(); // Load environment variables (PORT, AUTH_SECRET, etc.)
const path = require('path');
const fs = require('fs');
const Engine = require('./core/Engine');
const SecurityManager = require('./core/SecurityManager');
const Auth = require('./components/Auth');
const Router = require('./components/Router');
const WebSocketManager = require('./components/WebSocketManager');
const DatabaseManager = require('./components/DatabaseManager');
const Interpreter = require('./scripts/Interpreter');

// Additional functionalities
const RateLimiter = require('./components/RateLimiter');
const Logger = require('./components/Logger');
const SessionManager = require('./components/SessionManager');

/**
 * NeonJS class
 * Options: { port, authSecret, nsPath, autoLoad, rateLimiterOptions, sessionOptions }
 * - nsPath: If a file, it is the YAML configuration file; if a directory, all *.yaml files in that directory are loaded.
 * - autoLoad: defaults to true.
 *
 * Note: This module does not include self-execution code and is intended to be imported by external code.
 */
class NeonJS {
  constructor(options = {}) {
    this.port = options.port || process.env.PORT || 3000;
    this.authSecret = options.authSecret || process.env.AUTH_SECRET || 'default_secret_key';
    this.nsPath = options.nsPath || path.join(process.cwd(), 'setting.yaml');
    this.autoLoad = options.autoLoad !== undefined ? options.autoLoad : true;
    
    this.engine = new Engine();
    this.securityManager = new SecurityManager(this.engine.app);
    this.securityManager.init();
    
    const logger = new Logger();
    const rateLimiter = new RateLimiter(options.rateLimiterOptions || { windowMs: 60000, maxRequests: 100 });
    const sessionManager = new SessionManager(options.sessionOptions || {});
    
    this.engine.app.use(logger.middleware.bind(logger));
    this.engine.app.use(rateLimiter.middleware.bind(rateLimiter));
    this.engine.app.use(sessionManager.middleware.bind(sessionManager));
    
    this.auth = new Auth(this.authSecret);
    this.router = new Router(this.auth);
    this.engine.app.use(this.router.middleware.bind(this.router));
    
    this.wsManager = new WebSocketManager(this.engine.server);
    this.dbManager = new DatabaseManager();
    
    this.interpreter = new Interpreter(this.router, this.wsManager, this.dbManager);
    
    if (this.autoLoad && fs.existsSync(this.nsPath)) {
      try {
        const stat = fs.statSync(this.nsPath);
        if (stat.isDirectory()) {
          const yamlFiles = fs.readdirSync(this.nsPath).filter(file => file.endsWith('.yaml'));
          this.autoLoadPromise = Promise.all(yamlFiles.map(file => {
            const fullPath = path.join(this.nsPath, file);
            console.log(`NeonJS: Automatically loading YAML file ${fullPath}.`);
            return this.interpreter.interpret(fullPath);
          }));
        } else if (stat.isFile()) {
          console.log(`NeonJS: Automatically loading YAML file ${this.nsPath}.`);
          this.autoLoadPromise = this.interpreter.interpret(this.nsPath);
        }
      } catch (error) {
        console.error('NeonJS.autoLoad Error:', error);
        this.autoLoadPromise = Promise.resolve();
      }
    } else {
      this.autoLoadPromise = Promise.resolve();
      console.warn(`NeonJS: Could not find the YAML configuration file or directory (${this.nsPath}).`);
    }
  }
  
  async start() {
    try {
      await this.autoLoadPromise;
      await this.dbManager.migrateAll();
      this.engine.start(this.port);
    } catch (error) {
      console.error('NeonJS.start Error:', error);
      throw error;
    }
  }
  
  loadScript(nsPath) {
    const fullPath = path.resolve(nsPath);
    if (fs.existsSync(fullPath)) {
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          fs.readdirSync(fullPath)
            .filter(file => file.endsWith('.yaml'))
            .forEach(file => {
              const filePath = path.join(fullPath, file);
              console.log(`NeonJS: Dynamically loading YAML file ${filePath}.`);
              this.interpreter.interpret(filePath);
            });
        } else if (stat.isFile()) {
          console.log(`NeonJS: Dynamically loading YAML file ${fullPath}.`);
          this.interpreter.interpret(fullPath);
        }
      } catch (error) {
        console.error('NeonJS.loadScript Error:', error);
      }
    } else {
      console.warn(`NeonJS: The specified path was not found (${fullPath}).`);
    }
  }
}

module.exports = NeonJS;
