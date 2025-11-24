const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verificarToken, verificarAdmin } = require('../middlewares/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
// garantir que a pasta exista
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    // proteger contra directory traversal usando basename
    const safeName = path.basename(file.originalname);
    cb(null, Date.now() + '-' + safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Tipo de arquivo inválido.');
    err.code = 'INVALID_FILE_TYPE';
    return cb(err);
  },
});

// POST /file/upload
router.post('/upload', (req, res) => {
  upload.array('meusArquivos', 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 5MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Too many files' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: 'Tipo de arquivo inválido.' });
      }
      return res.status(400).json({ error: 'Erro no upload.' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo recebido.' });
    }
    return res.json({ message: `Upload realizado com sucesso! ${req.files.length} arquivo(s) recebido(s).` });
  });
});

// DELETE /file/:filename  (route mounted at /file so path is '/:filename')
router.delete('/:filename', verificarToken, verificarAdmin, (req, res) => {
  const { filename } = req.params || {};
  if (!filename) return res.status(400).json({ error: 'filename é obrigatório' });
  const safe = path.basename(filename);
  const target = path.join(uploadsDir, safe);
  fs.unlink(target, (err) => {
    if (err) {
      if (err.code === 'ENOENT') return res.status(404).json({ error: 'Arquivo não encontrado' });
      console.error('Erro ao deletar arquivo:', err && err.message);
      return res.status(500).json({ error: 'Erro ao deletar arquivo' });
    }
    return res.json({ message: 'Arquivo deletado com sucesso' });
  });
});

module.exports = router;
