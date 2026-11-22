// TP3 - API Bibliothèque : Express + MongoDB (Mongoose) + documentation Swagger
require('dotenv').config(); // 1re instruction : charge les variables du fichier .env

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connecterBD = require('./config/db');
const Livre = require('./models/Livre');
const Auteur = require('./models/Auteur');
const gestionErreurs = require('./middlewares/erreurs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de journalisation : [date] METHODE URL CODE - durée ms
app.use((req, res, next) => {
  const debut = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - debut} ms`);
  });
  next();
});

app.use(express.json());

// Documentation OpenAPI : interface Swagger UI + spécification brute en JSON
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// Routes de l'API
app.use('/api/livres', require('./routes/livres.routes'));
app.use('/api/auteurs', require('./routes/auteurs.routes'));

// 404 JSON : déclaré après toutes les routes
app.use((req, res) => {
  res.status(404).json({ erreur: `Route introuvable : ${req.method} ${req.originalUrl}` });
});

// Gestion centralisée des erreurs : toujours en DERNIER (4 paramètres)
app.use(gestionErreurs);

// Connexion à la base AVANT de démarrer l'écoute
async function demarrer() {
  await connecterBD();
  // Construit les index (ex : unicité de l'isbn) avant d'accepter des requêtes
  await Promise.all([Livre.init(), Auteur.init()]);
  app.listen(PORT, () => {
    console.log(`API Bibliothèque (MongoDB) démarrée sur http://localhost:${PORT}`);
    console.log(`Documentation Swagger : http://localhost:${PORT}/api-docs`);
  });
}

demarrer().catch((err) => {
  console.error('Erreur au démarrage :', err.message);
  process.exit(1);
});
