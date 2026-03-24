const http = require('http');

async function login() {
  const data = JSON.stringify({
    username: 'wms-admin-warehouse',
    password: 'wms@123'
  });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function register(token) {
  const data = JSON.stringify({
    username: 'new_staff_' + Date.now(),
    password: 'staff_pass_123',
    role: 'staff'
  });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      console.log('STATUS:', res.statusCode);
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  try {
    const loginData = await login();
    console.log('Logged in, role:', loginData.user.role);
    const regResult = await register(loginData.token);
    console.log('Register Result:', regResult);
  } catch (err) {
    console.error('Test Failed:', err.message);
  }
}

run();
