class RateLimiter {
    constructor(options = {}) {
      this.windowMs = options.windowMs || 60000;
      this.maxRequests = options.maxRequests || 100;
      this.errorMessage = options.errorMessage || 'Too Many Requests';
      this.ipMap = new Map();
      this.getKey = options.getKey || ((req) => req.connection.remoteAddress);
    }
    middleware(req, res, next) {
      try {
        const key = this.getKey(req);
        const currentTime = Date.now();
        if (!this.ipMap.has(key)) {
          this.ipMap.set(key, []);
        }
        let timestamps = this.ipMap.get(key);
        timestamps = timestamps.filter(ts => currentTime - ts < this.windowMs);
        if (timestamps.length >= this.maxRequests) {
          res.statusCode = 429;
          return res.end(this.errorMessage);
        }
        timestamps.push(currentTime);
        this.ipMap.set(key, timestamps);
        next();
      } catch (error) {
        console.error('RateLimiter.middleware Error:', error);
        next(error);
      }
    }
  }
  
  module.exports = RateLimiter;
  