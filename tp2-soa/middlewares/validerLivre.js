// Middleware de validation des livres (POST, PUT, PATCH)
// POST/PUT : tous les champs obligatoires sont vérifiés
// PATCH    : seuls les champs présents dans le corps sont vérifiés
module.exports = function validerLivre(req, res, next) {
  const body = req.body || {};
  const partiel = req.method === 'PATCH';
  const erreurs = [];
  const aVerifier = (champ) => !partiel || body[champ] !== undefined;
  const anneeCourante = new Date().getFullYear();

  if (partiel && Object.keys(body).length === 0) {
    erreurs.push('Aucun champ à modifier dans le corps de la requête');
  }

  if (aVerifier('titre') && (typeof body.titre !== 'string' || body.titre.trim() === '')) {
    erreurs.push('Le titre est obligatoire et ne doit pas être vide');
  }
  if (aVerifier('auteur') && (typeof body.auteur !== 'string' || body.auteur.trim() === '')) {
    erreurs.push("L'auteur est obligatoire et ne doit pas être vide");
  }
  if (aVerifier('annee') && (!Number.isInteger(body.annee) || body.annee < 1450 || body.annee > anneeCourante)) {
    erreurs.push(`L'année doit être un entier compris entre 1450 et ${anneeCourante}`);
  }
  if (aVerifier('isbn') && (typeof body.isbn !== 'string' || body.isbn.trim() === '')) {
    erreurs.push("L'ISBN est obligatoire");
  }
  if (body.disponible !== undefined && typeof body.disponible !== 'boolean') {
    erreurs.push('Le champ disponible doit être un booléen (true ou false)');
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }
  next();
};
