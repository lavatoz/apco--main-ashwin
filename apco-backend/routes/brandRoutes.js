const express = require('express');
const router = express.Router();
const { getBrands, createBrand, updateBrand, deleteBrand } = require('../controllers/brandController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getBrands)
    .post(protect, createBrand);

router.route('/:id')
    .put(protect, updateBrand)
    .delete(protect, deleteBrand);

module.exports = router;
