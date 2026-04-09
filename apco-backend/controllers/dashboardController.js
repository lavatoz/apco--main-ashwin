const Invoice = require('../models/Invoice');
const Brand = require('../models/Brand');

const getDashboardData = async (req, res) => {
    try {
        // As per requirement: fetch all invoices from the entire db
        const invoices = await Invoice.find();

        const totalRevenue = invoices.reduce((sum, inv) => {
            return sum + (inv.amount || 0);
        }, 0);

        const unpaid = invoices
            .filter(inv => (inv.status || '').toLowerCase() === 'unpaid')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);

        console.log("Calculated Dashboard:", { totalRevenue, unpaid });
        res.status(200).json({ totalRevenue, unpaid });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getDashboardData };
