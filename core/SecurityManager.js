class SecurityManager {
    constructor(app) {
      this.app = app;
    }
    init() {
      try {
        this.app.use((req, res, next) => {
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
          res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
          res.setHeader('Content-Security-Policy', "default-src 'self'");
          res.setHeader('Referrer-Policy', 'no-referrer');
          res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
          next();
        });
        this.app.use((req, res, next) => {
          if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            let data = '';
            req.on('data', (chunk) => { data += chunk; });
            req.on('end', () => {
              if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                try {
                  req.body = JSON.parse(data);
                } catch (error) {
                  console.error('SecurityManager JSON Parser Error:', error);
                  res.statusCode = 400;
                  return res.end('Invalid JSON');
                }
              } else {
                req.body = data;
              }
              next();
            });
          } else {
            next();
          }
        });
        console.log('SecurityManager: Enhanced security middleware initialized.');
      } catch (error) {
        console.error('SecurityManager Initialization Error:', error);
        throw error;
      }
    }
  }
  
  module.exports = SecurityManager;
  