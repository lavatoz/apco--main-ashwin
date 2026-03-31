const express = require('express');
const router = express.Router();
const { getClients, createClient, updateClient, deleteClient } = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getClients)
    .post(protect, createClient);

router.route('/:id')
    .put(protect, updateClient)
    .delete(protect, deleteClient);

module.exports = router;
