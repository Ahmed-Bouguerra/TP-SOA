// Modèle Auteur : un auteur peut avoir plusieurs livres (relation 1 -> N)
const mongoose = require('mongoose');

const auteurSchema = new mongoose.Schema({
  nom: { type: String, required: [true, 'Le nom est obligatoire'], trim: true },
  prenom: { type: String, trim: true },
  nationalite: { type: String, trim: true },
  dateNaissance: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Auteur', auteurSchema);
