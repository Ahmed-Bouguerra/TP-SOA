// Contrôleur des livres : logique CRUD sur le tableau en mémoire
const livres = require('../data/livres');

let prochainId = Math.max(0, ...livres.map((l) => l.id)) + 1;
const CHAMPS = ['titre', 'auteur', 'annee', 'isbn', 'disponible'];
const CHAMPS_TRI = ['id', ...CHAMPS];

// ---------- Fonctions utilitaires ----------
function indexDuLivre(req) {
  const id = Number(req.params.id);
  return livres.findIndex((l) => l.id === id);
}

function isbnDejaUtilise(isbn, idIgnore) {
  return livres.some((l) => l.isbn === isbn && l.id !== idIgnore);
}

// Ne garde que les champs connus (et enlève les espaces autour des textes)
function nettoyer(body) {
  const propre = {};
  for (const champ of CHAMPS) {
    if (body[champ] !== undefined) {
      propre[champ] = typeof body[champ] === 'string' ? body[champ].trim() : body[champ];
    }
  }
  return propre;
}

const introuvable = (res) => res.status(404).json({ erreur: 'Livre introuvable' });
const conflit = (res) => res.status(409).json({ erreur: 'Un livre avec cet ISBN existe déjà' });

// ---------- GET /api/livres : filtres, tri, pagination ----------
exports.getAll = (req, res) => {
  const { disponible, sort, order = 'asc' } = req.query;
  const auteur = typeof req.query.auteur === 'string' ? req.query.auteur : undefined;
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

  const erreurs = [];
  if (disponible !== undefined && !['true', 'false'].includes(disponible)) {
    erreurs.push('disponible doit valoir true ou false');
  }
  if (sort !== undefined && !CHAMPS_TRI.includes(sort)) {
    erreurs.push(`sort doit être l'un de : ${CHAMPS_TRI.join(', ')}`);
  }
  if (!['asc', 'desc'].includes(order)) erreurs.push('order doit valoir asc ou desc');
  if (!Number.isInteger(page) || page < 1) erreurs.push('page doit être un entier >= 1');
  if (!Number.isInteger(limit) || limit < 1) erreurs.push('limit doit être un entier >= 1');
  if (erreurs.length > 0) return res.status(400).json({ erreurs });

  let resultat = [...livres];

  // Filtres
  if (auteur) {
    resultat = resultat.filter((l) => l.auteur.toLowerCase().includes(auteur.toLowerCase()));
  }
  if (disponible !== undefined) {
    resultat = resultat.filter((l) => l.disponible === (disponible === 'true'));
  }

  // Tri
  if (sort) {
    const sens = order === 'desc' ? -1 : 1;
    resultat.sort((a, b) => {
      const x = a[sort];
      const y = b[sort];
      if (typeof x === 'string') return x.localeCompare(y) * sens;
      return (x > y ? 1 : x < y ? -1 : 0) * sens;
    });
  }

  // Pagination
  const total = resultat.length;
  const debut = (page - 1) * limit;
  res.json({ total, page, limit, data: resultat.slice(debut, debut + limit) });
};

// ---------- GET /api/livres/:id ----------
exports.getById = (req, res) => {
  const i = indexDuLivre(req);
  if (i === -1) return introuvable(res);
  res.json(livres[i]);
};

// ---------- POST /api/livres ----------
exports.create = (req, res) => {
  const donnees = nettoyer(req.body);
  if (isbnDejaUtilise(donnees.isbn)) return conflit(res);

  const livre = { id: prochainId++, disponible: true, ...donnees };
  livres.push(livre);
  res.status(201).location(`/api/livres/${livre.id}`).json(livre);
};

// ---------- PUT /api/livres/:id (remplacement complet) ----------
exports.replace = (req, res) => {
  const i = indexDuLivre(req);
  if (i === -1) return introuvable(res);

  const donnees = nettoyer(req.body);
  const id = livres[i].id;
  if (isbnDejaUtilise(donnees.isbn, id)) return conflit(res);

  livres[i] = { id, disponible: true, ...donnees };
  res.json(livres[i]);
};

// ---------- PATCH /api/livres/:id (modification partielle) ----------
exports.update = (req, res) => {
  const i = indexDuLivre(req);
  if (i === -1) return introuvable(res);

  const donnees = nettoyer(req.body);
  if (donnees.isbn !== undefined && isbnDejaUtilise(donnees.isbn, livres[i].id)) {
    return conflit(res);
  }

  livres[i] = { ...livres[i], ...donnees };
  res.json(livres[i]);
};

// ---------- DELETE /api/livres/:id ----------
exports.remove = (req, res) => {
  const i = indexDuLivre(req);
  if (i === -1) return introuvable(res);
  livres.splice(i, 1);
  res.status(204).end();
};
