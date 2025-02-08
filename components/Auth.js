const jwt = require('jsonwebtoken');

class Auth {
  constructor(secret) {
    this.secret = secret || 'default_secret_key';
  }
  generateToken(payload, expiresIn = '1h') {
    try {
      return jwt.sign(payload, this.secret, { expiresIn });
    } catch (error) {
      console.error('Auth.generateToken Error:', error);
      throw error;
    }
  }
  authenticate() {
    return (req, res, next) => {
      try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
          res.statusCode = 401;
          return res.end('No token provided');
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2) {
          res.statusCode = 401;
          return res.end('Token error');
        }
        const [scheme, token] = parts;
        if (!/^Bearer$/i.test(scheme)) {
          res.statusCode = 401;
          return res.end('Token malformatted');
        }
        jwt.verify(token, this.secret, (err, decoded) => {
          if (err) {
            res.statusCode = 401;
            return res.end('Invalid token');
          }
          req.user = decoded;
          next();
        });
      } catch (error) {
        console.error('Auth.authenticate Error:', error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    };
  }
}

module.exports = Auth;
