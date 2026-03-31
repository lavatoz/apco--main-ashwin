const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Brand = require('../models/Brand');

const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ brandId: req.query.brandId }).populate('clientId', 'name');
        res.status(200).json(invoices);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const createInvoice = async (req, res) => {
    try {
        const { amount, status, clientId, brandId } = req.body;
        const brand = await Brand.findById(brandId);
        if(!brand || brand.owner.toString() !== req.user.id) throw new Error('Not authorized');

        const invoice = await Invoice.create({ amount, status, clientId, brandId });
        res.status(201).json(invoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateInvoice = async (req, res) => {
    try {
        const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedInvoice);
    } catch (error) {
         res.status(400).json({ message: error.message });
    }
};

const deleteInvoice = async (req, res) => {
    try {
        await Invoice.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Deleted invoice' });
    } catch (error) {
         res.status(400).json({ message: error.message });
    }
};

const getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ brandId: req.query.brandId });
        res.status(200).json(expenses);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const createExpense = async (req, res) => {
    try {
        const { title, amount, brandId } = req.body;
        const brand = await Brand.findById(brandId);
        if(!brand || brand.owner.toString() !== req.user.id) throw new Error('Not authorized');

        const expense = await Expense.create({ title, amount, brandId });
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateExpense = async (req, res) => {
    try {
        const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedExpense);
    } catch (error) {
         res.status(400).json({ message: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Deleted expense' });
    } catch (error) {
         res.status(400).json({ message: error.message });
    }
};

const getFinancialSummary = async (req, res) => {
    try {
        const { brandId } = req.query;
        if (!brandId) throw new Error("Brand ID is required");

        const invoices = await Invoice.find({ brandId, status: 'paid' });
        const expenses = await Expense.find({ brandId });

        const totalRevenue = invoices.reduce((acc, inv) => acc + inv.amount, 0);
        const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
        const profit = totalRevenue - totalExpenses;

        res.status(200).json({ totalRevenue, totalExpenses, profit });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    getInvoices, createInvoice, updateInvoice, deleteInvoice,
    getExpenses, createExpense, updateExpense, deleteExpense,
    getFinancialSummary
};
