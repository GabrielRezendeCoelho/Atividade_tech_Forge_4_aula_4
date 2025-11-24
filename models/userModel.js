// Simulação de armazenamento em memória
let users = [];
let nextId = 1;

/**
 * addUser(user)
 * - user: { username, passwordHash, [email] }
 * - espera receber passwordHash (a rota deve gerar o hash com bcrypt)
 * - gera id incremental e armazena { id, username, passwordHash, email? }
 * - retorna o usuário criado (com id, username e passwordHash)
 */
function addUser(user) {
  if (!user || !user.username || !user.passwordHash) {
    throw new Error("username e passwordHash são obrigatórios");
  }

  // evitar duplicatas por username
  if (findByUsername(user.username)) {
    throw new Error("username já existe");
  }

  const id = nextId++;
  const stored = {
    id,
    username: user.username,
    passwordHash: user.passwordHash,
  };
  if (user.email) stored.email = user.email;
  users.push(stored);
  return stored;
}

/**
 * findByUsername(username)
 * - retorna o usuário (com id e passwordHash) ou null se não encontrado
 */
function findByUsername(username) {
  if (!username) return null;
  return users.find((u) => u.username === username) || null;
}

// APIs auxiliares (úteis para testes locais)
function _getAllUsers() {
  return users.slice();
}

function _resetForTests() {
  users = [];
  nextId = 1;
}

module.exports = {
  addUser,
  findByUsername,
  // helpers
  _getAllUsers,
  _resetForTests,
};
