// Configuration OpenAPI 3 (fourni dans l'énoncé).
// swagger-jsdoc lit les commentaires @swagger des fichiers de routes.
const swaggerJsdoc = require('swagger-jsdoc');

module.exports = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'API Bibliothèque ISET Tozeur', version: '1.0.0' },
    servers: [{ url: 'http://localhost:3000' }]
  },
  apis: ['./routes/*.js']
});
