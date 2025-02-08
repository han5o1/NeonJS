const pathModule = require('path');

class Router {
  constructor(authInstance) {
    this.routes = [];
    this.authInstance = authInstance;
  }

  registerRoute(route) {
    try {
      if (route.path.includes(':')) {
        const paramNames = [];
        const regexPath = route.path.replace(/:([^/]+)/g, (_, paramName) => {
          paramNames.push(paramName);
          return '([^/]+)';
        });
        route.regex = new RegExp(`^${regexPath}$`);
        route.paramNames = paramNames;
      }

      if (!route.response.handler) {
        route.response.handler = (req, res) => {
          switch (route.response.type) {
            case 'json':
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(route.response.data));
              break;
            case 'html':
              res.setHeader('Content-Type', 'text/html');
              res.end(route.response.data);
              break;
            case 'file':
              const filePath = pathModule.resolve(route.response.data);
              res.setHeader('Content-Disposition', `attachment; filename="${pathModule.basename(filePath)}"`);
              res.setHeader('Content-Type', 'application/octet-stream');
              require('fs').createReadStream(filePath).pipe(res);
              break;
            default:
              res.end(route.response.data);
          }
        };
      }

      if (route.authRequired) {
        const authMiddleware = this.authInstance.authenticate();
        const originalHandler = route.response.handler;
        route.response.handler = (req, res) => {
          authMiddleware(req, res, (err) => {
            if (err) {
              res.statusCode = 401;
              res.end('Unauthorized');
            } else {
              originalHandler(req, res);
            }
          });
        };
      }

      this.routes.push(route);
      console.log(`Router: [${route.method}] ${route.path} registered (authRequired: ${!!route.authRequired})`);
    } catch (error) {
      console.error('Router.registerRoute Error:', error, 'Route:', route);
    }
  }

  middleware(req, res, next) {
    try {
      const method = req.method.toLowerCase();
      const url = req.url.split('?')[0];
      let route = this.routes.find(r => r.method.toLowerCase() === method && r.path === url);

      if (!route) {
        for (let r of this.routes) {
          if (r.method.toLowerCase() === method && r.regex) {
            const match = url.match(r.regex);
            if (match) {
              req.params = {};
              r.paramNames.forEach((name, index) => {
                req.params[name] = match[index + 1];
              });
              route = r;
              break;
            }
          }
        }
      }

      if (route) {
        route.response.handler(req, res);
      } else {
        next();
      }
    } catch (error) {
      console.error('Router.middleware Error:', error);
      next(error);
    }
  }
}

module.exports = Router;
