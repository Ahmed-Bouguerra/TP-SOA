const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/livres.controller');

/**
 * @swagger
 * tags:
 *   - name: Livres
 *     description: Gestion des livres du catalogue
 *   - name: Auteurs
 *     description: Gestion des auteurs
 * components:
 *   schemas:
 *     AuteurResume:
 *       type: object
 *       description: Auteur tel qu'il apparaît dans un livre (populate)
 *       properties:
 *         _id:
 *           type: string
 *           example: 665f1c2e9b1e8a0012a4b7c1
 *         nom:
 *           type: string
 *           example: Martin
 *         prenom:
 *           type: string
 *           example: Robert C.
 *     Livre:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 665f1c9a9b1e8a0012a4b7d2
 *         titre:
 *           type: string
 *           example: Clean Code
 *         isbn:
 *           type: string
 *           example: "9780132350884"
 *         annee:
 *           type: integer
 *           minimum: 1450
 *           example: 2008
 *         genre:
 *           type: string
 *           enum: [Roman, Science, Informatique, Histoire, Autre]
 *           example: Informatique
 *         disponible:
 *           type: boolean
 *           example: true
 *         auteur:
 *           $ref: '#/components/schemas/AuteurResume'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     LivreInput:
 *       type: object
 *       required: [titre, isbn, auteur]
 *       properties:
 *         titre:
 *           type: string
 *           example: Clean Code
 *         isbn:
 *           type: string
 *           example: "9780132350884"
 *         annee:
 *           type: integer
 *           minimum: 1450
 *           example: 2008
 *         genre:
 *           type: string
 *           enum: [Roman, Science, Informatique, Histoire, Autre]
 *           default: Autre
 *         disponible:
 *           type: boolean
 *           default: true
 *         auteur:
 *           type: string
 *           description: Identifiant (_id) de l'auteur
 *           example: 665f1c2e9b1e8a0012a4b7c1
 *     ListeLivres:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Nombre de livres après filtrage, avant pagination
 *           example: 3
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Livre'
 *     Erreur:
 *       type: object
 *       properties:
 *         erreur:
 *           type: string
 *           example: Livre introuvable
 *     ErreursValidation:
 *       type: object
 *       properties:
 *         erreurs:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Le titre est obligatoire"]
 */

/**
 * @swagger
 * /api/livres:
 *   get:
 *     summary: Lister les livres (filtres, tri, pagination)
 *     tags: [Livres]
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *           enum: [Roman, Science, Informatique, Histoire, Autre]
 *         description: Filtrer par genre
 *       - in: query
 *         name: disponible
 *         schema:
 *           type: boolean
 *         description: Filtrer par disponibilité
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [titre, isbn, annee, genre, disponible, createdAt]
 *         description: Champ de tri
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Ordre du tri
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Liste paginée des livres
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListeLivres'
 *       400:
 *         description: Paramètre de requête invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErreursValidation'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/livres/{id}:
 *   get:
 *     summary: Consulter un livre
 *     tags: [Livres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant du livre
 *     responses:
 *       200:
 *         description: Le livre demandé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Livre'
 *       400:
 *         description: Identifiant invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 *       404:
 *         description: Livre introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/livres:
 *   post:
 *     summary: Créer un livre
 *     tags: [Livres]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LivreInput'
 *     responses:
 *       201:
 *         description: Livre créé (en-tête Location renseigné)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Livre'
 *       400:
 *         description: Données invalides ou auteur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErreursValidation'
 *       409:
 *         description: ISBN déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/livres/{id}:
 *   put:
 *     summary: Remplacer entièrement un livre
 *     tags: [Livres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant du livre
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LivreInput'
 *     responses:
 *       200:
 *         description: Livre remplacé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Livre'
 *       400:
 *         description: Données ou identifiant invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErreursValidation'
 *       404:
 *         description: Livre introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 *       409:
 *         description: ISBN déjà utilisé par un autre livre
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 */
router.put('/:id', ctrl.replace);

/**
 * @swagger
 * /api/livres/{id}:
 *   patch:
 *     summary: Modifier partiellement un livre
 *     tags: [Livres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant du livre
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               isbn:
 *                 type: string
 *               annee:
 *                 type: integer
 *               genre:
 *                 type: string
 *                 enum: [Roman, Science, Informatique, Histoire, Autre]
 *               disponible:
 *                 type: boolean
 *               auteur:
 *                 type: string
 *             example:
 *               disponible: false
 *     responses:
 *       200:
 *         description: Livre modifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Livre'
 *       400:
 *         description: Données ou identifiant invalides, ou corps vide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErreursValidation'
 *       404:
 *         description: Livre introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 *       409:
 *         description: ISBN déjà utilisé par un autre livre
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 */
router.patch('/:id', ctrl.update);

/**
 * @swagger
 * /api/livres/{id}:
 *   delete:
 *     summary: Supprimer un livre
 *     tags: [Livres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant du livre
 *     responses:
 *       204:
 *         description: Livre supprimé (pas de corps)
 *       400:
 *         description: Identifiant invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 *       404:
 *         description: Livre introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 */
router.delete('/:id', ctrl.remove);

module.exports = router;
