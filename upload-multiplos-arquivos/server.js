const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

const app = express();
const PORT = 3000;

app.use(
  cors({
    origin: /localhost|127\.0\.0\.1/,
    methods: ["POST", "GET", "OPTIONS"],
  })
);

// permitir parsing de JSON no body (para rota /register)
app.use(express.json());

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg"];
    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }
    const err = new Error("Tipo de arquivo inválido.");
    err.code = "INVALID_FILE_TYPE";
    return cb(err);
  },
});

app.get("/", (_req, res) => {
  res.send("Servidor de upload está online. POST /upload");
});

app.post("/upload", (req, res) => {
  upload.array("meusArquivos", 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "Arquivo muito grande. Tamanho máximo: 5MB." });
      }
      if (
        err.code === "LIMIT_FILE_COUNT" ||
        err.code === "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({ error: "Too many files" });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      if (err.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({ error: "Tipo de arquivo inválido." });
      }
      return res.status(400).json({ error: "Erro no upload." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo recebido." });
    }

    return res.json({
      message: `Upload realizado com sucesso! ${req.files.length} arquivo(s) recebido(s).`,
    });
  });
});

// Rota de cadastro de usuário
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username e password são obrigatórios" });
    }

    // verifica se já existe
    if (userModel.findByUsername(username)) {
      return res.status(400).json({ error: "username já existe" });
    }

    // gerar hash com bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // salvar usuário (userModel espera passwordHash)
    const created = userModel.addUser({ username, email, passwordHash });

    return res
      .status(201)
      .json({ message: "Usuário criado com sucesso", id: created.id });
  } catch (err) {
    console.error("Erro em /register:", err && err.message);
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
