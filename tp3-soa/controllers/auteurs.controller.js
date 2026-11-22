// Contrôleur des auteurs (CRUD complet + livres d'un auteur).
const Auteur = require('../models/Auteur');
const Livre = require('../models/Livre');

// GET /api/auteurs
exports.getAll = async (req, res, next) => {
  try {
    const auteurs = await Auteur.find().sort({ nom: 1, prenom: 1 });
    res.json(auteurs);
  } catch (err) {
    next(err);
  }
};

// GET /api/auteurs/:id
exports.getById = async (req, res, next) => {
  try {
    const auteur = await Auteur.findById(req.params.id);
    if (!auteur) return res.status(404).json({ erreur: 'Auteur introuvable' });
    res.json(auteur);
  } catch (err) {
    next(err);
  }
};

// GET /api/auteurs/:id/livres : les livres d'un auteur
exports.getLivres = async (req, res, next) => {
  try {
    const auteur = await Auteur.findById(req.params.id);
    if (!auteur) return res.status(404).json({ erreur: 'Auteur introuvable' });
    const livres = await Livre.find({ auteur: auteur._id }).populate('auteur', 'nom prenom').sort({ _id: 1 });
    res.json(livres);
  } catch (err) {
    next(err);
  }
};

// POST /api/auteurs
exports.create = async (req, res, next) => {
  try {
    const auteur = await Auteur.create(req.body ?? {});
    res.status(201).location(`/api/auteurs/${auteur._id}`).json(auteur);
  } catch (err) {
    next(err);
  }
};

// PUT /api/auteurs/:id (remplacement complet)
exports.replace = async (req, res, next) => {
  try {
    const corps = req.body ?? {};
    await new Auteur(corps).validate(); // le remplacement doit respecter tout le schéma
    const auteur = await Auteur.findOneAndReplace(
      { _id: req.params.id }, corps, { returnDocument: 'after', runValidators: true }
    );
    if (!auteur) return res.status(404).json({ erreur: 'Auteur introuvable' });
    res.json(auteur);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auteurs/:id (modification partielle)
exports.update = async (req, res, next) => {
  try {
    const corps = req.body ?? {};
    if (Object.keys(corps).length === 0) {
      return res.status(400).json({ erreurs: ['Aucun champ à modifier dans le corps de la requête'] });
    }
    const auteur = await Auteur.findByIdAndUpdate(
      req.params.id, { $set: corps }, { returnDocument: 'after', runValidators: true }
    );
    if (!auteur) return res.status(404).json({ erreur: 'Auteur introuvable' });
    res.json(auteur);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/auteurs/:id : interdit tant que l'auteur possède des livres (409)
exports.remove = async (req, res, next) => {
  try {
    const auteur = await Auteur.findById(req.params.id);
    if (!auteur) return res.status(404).json({ erreur: 'Auteur introuvable' });

    const nbLivres = await Livre.countDocuments({ auteur: auteur._id });
    if (nbLivres > 0) {
      return res.status(409).json({
        erreur: `Suppression impossible : cet auteur possède encore ${nbLivres} livre(s)`
      });
    }
    await auteur.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
