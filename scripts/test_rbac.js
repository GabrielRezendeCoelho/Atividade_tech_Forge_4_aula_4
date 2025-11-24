const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = 'localhost';
const PORT = 3000;

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function waitForServer(retries = 20, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await request({ hostname: HOST, port: PORT, path: '/', method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (res && res.status < 500) return true;
    } catch (e) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error('Servidor não respondeu em tempo');
}

async function run() {
  const uploadsDir = path.join(__dirname, '..', 'upload-multiplos-arquivos', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const adminFile = 'test-admin.png';
  const userFile = 'test-user.png';
  fs.writeFileSync(path.join(uploadsDir, adminFile), 'dummy');
  fs.writeFileSync(path.join(uploadsDir, userFile), 'dummy');
  console.log('Arquivos de teste criados em', uploadsDir);

  await waitForServer();
  console.log('Servidor respondendo. Iniciando testes...');

  // login admin
  const adminLogin = await request({ hostname: HOST, port: PORT, path: '/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { username: 'admin', password: 'Admin123!' });
  console.log('\nAdmin login:', adminLogin.status, adminLogin.body);
  if (!adminLogin.body || !adminLogin.body.token) {
    console.error('Falha ao obter token admin. Abortando.');
    process.exit(1);
  }
  const adminToken = adminLogin.body.token;

  // admin delete adminFile
  const delAdmin = await request({ hostname: HOST, port: PORT, path: `/file/${adminFile}`, method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` } });
  console.log('\nDELETE as admin:', delAdmin.status, delAdmin.body);

  // register normal user
  const regUser = await request({ hostname: HOST, port: PORT, path: '/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { username: 'testuser', email: 'testuser@example.com', password: 'Senha123!' });
  console.log('\nRegister user:', regUser.status, regUser.body);

  // login normal user
  const userLogin = await request({ hostname: HOST, port: PORT, path: '/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { username: 'testuser', password: 'Senha123!' });
  console.log('\nUser login:', userLogin.status, userLogin.body);
  if (!userLogin.body || !userLogin.body.token) {
    console.error('Falha ao obter token user. Abortando.');
    process.exit(1);
  }
  const userToken = userLogin.body.token;

  // user tries to delete userFile
  const delUser = await request({ hostname: HOST, port: PORT, path: `/file/${userFile}`, method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` } });
  console.log('\nDELETE as user:', delUser.status, delUser.body);

  console.log('\nTeste finalizado.');
}

run().catch((err) => {
  console.error('Erro nos testes:', err && err.message);
  process.exit(1);
});
