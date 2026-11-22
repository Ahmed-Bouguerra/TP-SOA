// Middleware global de gestion des erreurs (4 paramètres : err, req, res, next).
// Il doit être déclaré APRÈS toutes les routes dans server.js.
module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  // JSON mal formé dans le corps de la requête (erreur d'express.json())
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erreurs: ['Corps JSON invalide'] });
  }

  // Erreur de validation Mongoose -> 400 + liste des messages
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ erreurs: messages });
  }

  // Valeur impossible à convertir (ex : identifiant mal formé) -> 400
  if (err.name === 'CastError') {
    const message = err.path === '_id'
      ? `Identifiant invalide : ${err.value}`
      : `Valeur invalide pour « ${err.path} » : ${err.value}`;
    return res.status(400).json({ erreur: message });
  }

  // Clé dupliquée (index unique, ex : isbn) -> 409
  if (err.code === 11000) {
    const champ = err.keyPattern ? Object.keys(err.keyPattern)[0]
      : err.keyValue ? Object.keys(err.keyValue)[0] : 'champ unique';
    return res.status(409).json({ erreur: `Valeur déjà utilisée pour ${champ}` });
  }

  // Toute autre erreur -> 500 (le détail reste dans la console seulement)
  console.error(err);
  res.status(500).json({ erreur: 'Erreur interne du serveur' });
};
