// TP1 - Parties 3 et 4 + exercice Calculatrice : service web avec Express
const express = require('express');
const app = express();
const PORT = 3000;

// ---------- Middleware de journalisation ----------
// Affiche : [date] METHODE URL CODE - durée ms
app.use((req, res, next) => {
  const debut = Date.now();
  res.on('finish', () => {
    const duree = Date.now() - debut;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duree} ms`);
  });
  next();
});

// ---------- Décodage du corps JSON ----------
// (si on retire cette ligne, req.body est undefined dans POST /api/echo)
app.use(express.json());

// ---------- Routes de base ----------
app.get('/', (req, res) => {
  res.send('Bienvenue dans le TP1 SOA');
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});

// GET /api/hello/:nom?lang=fr|en|ar
const SALUTATIONS = { fr: 'Bonjour', en: 'Hello', ar: 'مرحبا' };

app.get('/api/hello/:nom', (req, res) => {
  const { nom } = req.params;
  const { lang } = req.query;

  // Sans paramètre lang : français par défaut, sans le champ "lang"
  if (lang === undefined) {
    return res.json({ message: `${SALUTATIONS.fr} ${nom}` });
  }
  if (!Object.hasOwn(SALUTATIONS, lang)) {
    return res.status(400).json({
      erreur: `Langue non supportée : ${lang}`,
      langues: Object.keys(SALUTATIONS)
    });
  }
  res.json({ message: `${SALUTATIONS[lang]} ${nom}`, lang });
});

app.get('/api/date', (req, res) => {
  res.json({ date: new Date().toISOString() });
});

// ---------- POST /api/echo ----------
app.post('/api/echo', (req, res) => {
  res.json({ recu: req.body ?? {}, recuLe: new Date().toISOString() });
});

// ---------- Service Calculatrice ----------
const OPERATIONS = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
  div: (a, b) => a / b
};

// Convertit une valeur en nombre ; NaN si absente, vide ou non numérique
function versNombre(v) {
  if (v === undefined || v === null || String(v).trim() === '') return NaN;
  return Number(v);
}

// Logique de calcul UNIQUE, partagée par GET et POST
// Retourne { status, body }
function calculer(op, aBrut, bBrut) {
  const a = versNombre(aBrut);
  const b = versNombre(bBrut);

  if (Number.isNaN(a) || Number.isNaN(b)) {
    return { status: 400, body: { erreur: 'Les paramètres a et b sont obligatoires et doivent être numériques' } };
  }
  if (!Object.hasOwn(OPERATIONS, op)) {
    return { status: 400, body: { erreur: `Opération inconnue : ${op}`, operations: Object.keys(OPERATIONS) } };
  }
  if (op === 'div' && b === 0) {
    return { status: 400, body: { erreur: 'Division par zéro impossible' } };
  }
  return { status: 200, body: { op, a, b, resultat: OPERATIONS[op](a, b) } };
}

// GET /api/calc?op=add&a=5&b=3
app.get('/api/calc', (req, res) => {
  const { op, a, b } = req.query;
  const r = calculer(op, a, b);
  res.status(r.status).json(r.body);
});

// Bonus : POST /api/calc avec { "op": "mul", "a": 4, "b": 2.5 }
app.post('/api/calc', (req, res) => {
  const { op, a, b } = req.body || {};
  const r = calculer(op, a, b);
  res.status(r.status).json(r.body);
});

// ---------- 404 : doit rester APRÈS toutes les routes ----------
app.use((req, res) => {
  res.status(404).json({ erreur: `Route introuvable : ${req.method} ${req.originalUrl}` });
});

// ---------- Erreurs (ex : JSON invalide dans le corps) ----------
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erreur: 'Corps JSON invalide' });
  }
  console.error(err);
  res.status(500).json({ erreur: 'Erreur interne du serveur' });
});

app.listen(PORT, () => console.log('API démarrée sur le port ' + PORT));
