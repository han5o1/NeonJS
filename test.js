// test.js
const NeonJS = require('./index');
const http = require('http');
const { WebSocket } = require('ws');

// Helper function to perform HTTP requests
async function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
    if (postData) req.write(postData);
    req.end();
  });
}

async function testNeonJS() {
  // Instantiate NeonJS with the test_setting.yaml (no database configurations)
  const app = new NeonJS({
    nsPath: __dirname + '/examples/test_setting.yaml',
    port: 4000,
    autoLoad: true,
    rateLimiterOptions: { windowMs: 60000, maxRequests: 50, errorMessage: 'Rate limit exceeded' },
    sessionOptions: { cookieName: 'my_session' }
  });

  await app.start();
  console.log('NeonJS server started on port 4000 for testing.');

  // Test /public route
  let response = await makeRequest({ method: 'GET', hostname: 'localhost', port: 4000, path: '/public' });
  console.log('/public:', response);

  // Test /login to get token
  const loginData = JSON.stringify({ username: 'testuser', password: 'testpass' });
  response = await makeRequest({
    method: 'POST',
    hostname: 'localhost',
    port: 4000,
    path: '/login',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  }, loginData);
  console.log('/login:', response);
  const token = JSON.parse(response.body).token;
  console.log('Token received:', token);

  // Test /secure with token
  response = await makeRequest({
    method: 'GET',
    hostname: 'localhost',
    port: 4000,
    path: '/secure',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('/secure with token:', response);

  // Test plugin route from samplePlugin: /plugin-route
  response = await makeRequest({ method: 'GET', hostname: 'localhost', port: 4000, path: '/plugin-route' });
  console.log('/plugin-route:', response);

  // Test shopping mall plugin routes
  response = await makeRequest({ method: 'GET', hostname: 'localhost', port: 4000, path: '/products' });
  console.log('/products:', response);

  response = await makeRequest({ method: 'GET', hostname: 'localhost', port: 4000, path: '/products/1' });
  console.log('/products/1:', response);

  response = await makeRequest({ method: 'POST', hostname: 'localhost', port: 4000, path: '/cart' });
  console.log('POST /cart:', response);

  response = await makeRequest({ method: 'GET', hostname: 'localhost', port: 4000, path: '/cart' });
  console.log('GET /cart:', response);

  response = await makeRequest({ method: 'POST', hostname: 'localhost', port: 4000, path: '/checkout' });
  console.log('POST /checkout:', response);

  // Test WebSocket: Connect and send a message
  await new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:4000/ws');
    ws.on('open', () => {
      console.log('WebSocket connected.');
      ws.send('Hello WebSocket');
    });
    ws.on('message', (data) => {
      console.log('WebSocket received:', data.toString());
      ws.close();
      resolve();
    });
    ws.on('error', (err) => {
      reject(err);
    });
  });

  // Test Rate Limiter: Send multiple requests quickly
  let rateTestResults = [];
  for (let i = 0; i < 60; i++) {
    try {
      let res = await makeRequest({ method: 'GET', hostname: 'localhost', port: 4000, path: '/public' });
      rateTestResults.push(res.statusCode);
    } catch (err) {
      rateTestResults.push('error');
    }
  }
  console.log('Rate limiter test results (status codes):', rateTestResults);

  console.log('All tests completed.');
}

testNeonJS().catch(err => console.error('Test Error:', err));
