const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auteurs.controller');

/**
 * @swagger
 * components:
 *   schemas:
 *     Auteur:
 *       type: object
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
 *         nationalite:
 *           type: string
 *           example: Américaine
 *         dateNaissance:
 *           type: string
 *           format: date
 *           example: "1952-12-05"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AuteurInput:
 *       type: object
 *       required: [nom]
 *       properties:
 *         nom:
 *           type: string
 *           example: Martin
 *         prenom:
 *           type: string
 *           example: Robert C.
 *         nationalite:
 *           type: string
 *           example: Américaine
 *         dateNaissance:
 *           type: string
 *           format: date
 *           example: "1952-12-05"
 */

/**
 * @swagger
 * /api/auteurs:
 *   get:
 *     summary: Lister les auteurs
 *     tags: [Auteurs]
 *     responses:
 *       200:
 *         description: Liste des auteurs (triée par nom)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Auteur'
 */
router.get('/', ctrl.getAll);

/**
 * @swagger
 * /api/auteurs/{id}/livres:
 *   get:
 *     summary: Lister les livres d'un auteur
 *     tags: [Auteurs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'auteur
 *     responses:
 *       200:
 *         description: Livres de l'auteur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Livre'
 *       400:
 *         description: Identifiant invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 *       404:
 *         description: Auteur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 */
router.get('/:id/livres', ctrl.getLivres);

/**
 * @swagger
 * /api/auteurs/{id}:
 *   get:
 *     summary: Consulter un auteur
 *     tags: [Auteurs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'auteur
 *     responses:
 *       200:
 *         description: L'auteur demandé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Auteur'
 *       400:
 *         description: Identifiant invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 *       404:
 *         description: Auteur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 */
router.get('/:id', ctrl.getById);

/**
 * @swagger
 * /api/auteurs:
 *   post:
 *     summary: Créer un auteur
 *     tags: [Auteurs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuteurInput'
 *     responses:
 *       201:
 *         description: Auteur créé (en-tête Location renseigné)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Auteur'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErreursValidation'
 */
router.post('/', ctrl.create);

/**
 * @swagger
 * /api/auteurs/{id}:
 *   put:
 *     summary: Remplacer entièrement un auteur
 *     tags: [Auteurs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'auteur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuteurInput'
 *     responses:
 *       200:
 *         description: Auteur remplacé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Auteur'
 *       400:
 *         description: Données ou identifiant invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErreursValidation'
 *       404:
 *         description: Auteur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 */
router.put('/:id', ctrl.replace);

/**
 * @swagger
 * /api/auteurs/{id}:
 *   patch:
 *     summary: Modifier partiellement un auteur
 *     tags: [Auteurs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'auteur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               nationalite:
 *                 type: string
 *               dateNaissance:
 *                 type: string
 *                 format: date
 *             example:
 *               nationalite: Française
 *     responses:
 *       200:
 *         description: Auteur modifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Auteur'
 *       400:
 *         description: Données ou identifiant invalides, ou corps vide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErreursValidation'
 *       404:
 *         description: Auteur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 */
router.patch('/:id', ctrl.update);

/**
 * @swagger
 * /api/auteurs/{id}:
 *   delete:
 *     summary: Supprimer un auteur (interdit s'il possède encore des livres)
 *     tags: [Auteurs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant de l'auteur
 *     responses:
 *       204:
 *         description: Auteur supprimé (pas de corps)
 *       400:
 *         description: Identifiant invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 *       404:
 *         description: Auteur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 *       409:
 *         description: L'auteur possède encore des livres
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erreur'
 */
router.delete('/:id', ctrl.remove);

module.exports = router;
