const crypto = require('crypto');

class SessionManager {
  constructor(options = {}) {
    this.sessions = new Map();
    this.cookieName = options.cookieName || 'neonjs_session';
  }
  middleware(req, res, next) {
    try {
      const cookies = this.parseCookies(req.headers.cookie);
      let sessionId = cookies[this.cookieName];
      if (!sessionId || !this.sessions.has(sessionId)) {
        sessionId = crypto.randomBytes(16).toString('hex');
        this.sessions.set(sessionId, {});
        res.setHeader('Set-Cookie', `${this.cookieName}=${sessionId}; HttpOnly; Secure; Path=/`);
      }
      req.session = this.sessions.get(sessionId);
      next();
    } catch (error) {
      console.error('SessionManager.middleware Error:', error);
      next(error);
    }
  }
  parseCookies(cookieHeader) {
    const list = {};
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach(cookie => {
      let parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
  }
}

module.exports = SessionManager;
