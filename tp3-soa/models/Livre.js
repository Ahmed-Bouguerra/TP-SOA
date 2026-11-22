// Modèle Livre : référence son auteur par son identifiant (ObjectId)
const mongoose = require('mongoose');

const GENRES = ['Roman', 'Science', 'Informatique', 'Histoire', 'Autre'];

const livreSchema = new mongoose.Schema({
  titre: { type: String, required: [true, 'Le titre est obligatoire'], trim: true },
  isbn: { type: String, required: [true, "L'ISBN est obligatoire"], unique: true, trim: true },
  annee: {
    type: Number,
    min: [1450, "L'année doit être supérieure ou égale à 1450"],
    max: [new Date().getFullYear(), "L'année ne peut pas dépasser l'année courante"],
    validate: { validator: Number.isInteger, message: "L'année doit être un entier" }
  },
  genre: {
    type: String,
    enum: { values: GENRES, message: 'Genre invalide : {VALUE}' },
    default: 'Autre'
  },
  disponible: { type: Boolean, default: true },
  auteur: { type: mongoose.Schema.Types.ObjectId, ref: 'Auteur', required: [true, "L'auteur est obligatoire"] }
}, { timestamps: true });

module.exports = mongoose.model('Livre', livreSchema);
module.exports.GENRES = GENRES;
