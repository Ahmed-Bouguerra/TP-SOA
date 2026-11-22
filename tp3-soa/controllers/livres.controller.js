// Contrôleur des livres (async/await + Mongoose).
// Chaque fonction suit le modèle try { ... } catch (err) { next(err); } :
// les erreurs sont transmises au middleware global (middlewares/erreurs.js).
const mongoose = require('mongoose');
const Livre = require('../models/Livre');
const Auteur = require('../models/Auteur');

const CHAMPS_TRI = ['titre', 'isbn', 'annee', 'genre', 'disponible', 'createdAt'];
const AUTEUR_VISIBLE = 'nom prenom'; // champs de l'auteur renvoyés par populate

// Vérifie qu'un identifiant d'auteur existe dans la base
async function auteurExiste(id) {
  if (!mongoose.isValidObjectId(id)) return false;
  return !!(await Auteur.exists({ _id: id }));
}

// GET /api/livres?genre=&disponible=&sort=&order=&page=&limit=
exports.getAll = async (req, res, next) => {
  try {
    const { genre, disponible, sort, order } = req.query;
    const erreurs = [];
    const filtre = {};

    // Filtres
    if (genre !== undefined) {
      if (!Livre.GENRES.includes(genre)) erreurs.push(`genre doit être l'un de : ${Livre.GENRES.join(', ')}`);
      else filtre.genre = genre;
    }
    if (disponible !== undefined) {
      if (disponible !== 'true' && disponible !== 'false') erreurs.push('disponible doit valoir true ou false');
      else filtre.disponible = disponible === 'true';
    }

    // Tri (ordre par défaut : asc) ; _id sert de départage pour une pagination stable
    let tri = { _id: 1 };
    if (order !== undefined && order !== 'asc' && order !== 'desc') erreurs.push('order doit valoir asc ou desc');
    if (sort !== undefined) {
      if (!CHAMPS_TRI.includes(sort)) erreurs.push(`sort doit être l'un de : ${CHAMPS_TRI.join(', ')}`);
      else tri = { [sort]: order === 'desc' ? -1 : 1, _id: 1 };
    }

    // Pagination (page 1 et 10 éléments par défaut)
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
    if (!Number.isInteger(page) || page < 1) erreurs.push('page doit être un entier >= 1');
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) erreurs.push('limit doit être un entier compris entre 1 et 100');

    if (erreurs.length > 0) return res.status(400).json({ erreurs });

    const total = await Livre.countDocuments(filtre); // total APRÈS filtrage, AVANT pagination
    const data = await Livre.find(filtre)
      .populate('auteur', AUTEUR_VISIBLE)
      .sort(tri)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ total, page, limit, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/livres/:id
exports.getById = async (req, res, next) => {
  try {
    const livre = await Livre.findById(req.params.id).populate('auteur', AUTEUR_VISIBLE);
    if (!livre) return res.status(404).json({ erreur: 'Livre introuvable' });
    res.json(livre);
  } catch (err) {
    next(err);
  }
};

// POST /api/livres
exports.create = async (req, res, next) => {
  try {
    const corps = req.body ?? {};
    if (corps.auteur !== undefined && !(await auteurExiste(corps.auteur))) {
      return res.status(400).json({ erreurs: [`Auteur introuvable : ${corps.auteur}`] });
    }
    const livre = await Livre.create(corps);
    await livre.populate('auteur', AUTEUR_VISIBLE);
    res.status(201).location(`/api/livres/${livre._id}`).json(livre);
  } catch (err) {
    next(err);
  }
};

// PUT /api/livres/:id (remplacement complet)
exports.replace = async (req, res, next) => {
  try {
    const corps = req.body ?? {};
    if (corps.auteur !== undefined && !(await auteurExiste(corps.auteur))) {
      return res.status(400).json({ erreurs: [`Auteur introuvable : ${corps.auteur}`] });
    }
    // On valide d'abord le document complet : un remplacement doit respecter
    // toutes les contraintes du schéma (champs obligatoires, enum, min/max...).
    await new Livre(corps).validate();

    const livre = await Livre.findOneAndReplace(
      { _id: req.params.id }, corps, { returnDocument: 'after', runValidators: true }
    ).populate('auteur', AUTEUR_VISIBLE);
    if (!livre) return res.status(404).json({ erreur: 'Livre introuvable' });
    res.json(livre);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/livres/:id (modification partielle)
exports.update = async (req, res, next) => {
  try {
    const corps = req.body ?? {};
    if (Object.keys(corps).length === 0) {
      return res.status(400).json({ erreurs: ['Aucun champ à modifier dans le corps de la requête'] });
    }
    if (corps.auteur !== undefined && !(await auteurExiste(corps.auteur))) {
      return res.status(400).json({ erreurs: [`Auteur introuvable : ${corps.auteur}`] });
    }
    // runValidators : sans cette option, Mongoose ne vérifie pas les contraintes lors d'une mise à jour
    const livre = await Livre.findByIdAndUpdate(
      req.params.id, { $set: corps }, { returnDocument: 'after', runValidators: true }
    ).populate('auteur', AUTEUR_VISIBLE);
    if (!livre) return res.status(404).json({ erreur: 'Livre introuvable' });
    res.json(livre);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/livres/:id
exports.remove = async (req, res, next) => {
  try {
    const livre = await Livre.findByIdAndDelete(req.params.id);
    if (!livre) return res.status(404).json({ erreur: 'Livre introuvable' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
