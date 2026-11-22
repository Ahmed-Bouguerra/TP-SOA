// Connexion à MongoDB (fourni dans l'énoncé)
const mongoose = require('mongoose');

module.exports = async function connecterBD() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Échec de connexion MongoDB :', err.message);
    process.exit(1);
  }
};
