const express = require('express');
const router = express.Router();
const {
    getInvoices, createInvoice, updateInvoice, deleteInvoice,
    getExpenses, createExpense, updateExpense, deleteExpense,
    getFinancialSummary
} = require('../controllers/financeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getFinancialSummary);

router.route('/invoices')
    .get(protect, getInvoices)
    .post(protect, createInvoice);

router.route('/invoices/:id')
    .put(protect, updateInvoice)
    .delete(protect, deleteInvoice);

router.route('/expenses')
    .get(protect, getExpenses)
    .post(protect, createExpense);

router.route('/expenses/:id')
    .put(protect, updateExpense)
    .delete(protect, deleteExpense);

module.exports = router;
