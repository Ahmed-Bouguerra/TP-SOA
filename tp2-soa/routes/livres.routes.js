const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/livres.controller');
const validerLivre = require('../middlewares/validerLivre');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', validerLivre, ctrl.create);
router.put('/:id', validerLivre, ctrl.replace);
router.patch('/:id', validerLivre, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
