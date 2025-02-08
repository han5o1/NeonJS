module.exports.loginHandler = (req, res) => {
    try {
      const { username, password } = req.body;
      if (username && password) {
        const Auth = require('../../components/Auth');
        const authInstance = new Auth(process.env.AUTH_SECRET || 'default_secret_key');
        const token = authInstance.generateToken({ username });
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ token }));
      } else {
        res.statusCode = 400;
        res.end('Missing credentials');
      }
    } catch (error) {
      console.error('loginHandler Error:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  };
  