const http = require('http');

const data = JSON.stringify({
  name: "Admin User",
  email: "admin@apco.com",
  password: "password123"
});

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  let resData = '';
  res.on('data', chunk => { resData += chunk; });
  res.on('end', () => console.log('Response:', resData));
});

req.on('error', error => console.error('Error:', error));
req.write(data);
req.end();
