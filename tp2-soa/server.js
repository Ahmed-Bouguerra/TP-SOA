// TP2 - API REST CRUD : gestion d'une bibliothèque (données en mémoire)
const express = require('express');
const app = express();
const PORT = 3000;

// Journalisation : [date] METHODE URL CODE - durée ms
app.use((req, res, next) => {
  const debut = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - debut} ms`);
  });
  next();
});

app.use(express.json());
app.use('/api/livres', require('./routes/livres.routes'));

// 404 : après toutes les routes
app.use((req, res) => {
  res.status(404).json({ erreur: `Route introuvable : ${req.method} ${req.originalUrl}` });
});

// Gestion d'erreurs (JSON invalide, erreur inattendue)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erreurs: ['Corps JSON invalide'] });
  }
  console.error(err);
  res.status(500).json({ erreur: 'Erreur interne du serveur' });
});

app.listen(PORT, () => console.log('API Bibliothèque démarrée sur http://localhost:' + PORT));
