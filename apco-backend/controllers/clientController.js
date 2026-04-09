const Client = require('../models/Client');
const Brand = require('../models/Brand');
const Project = require('../models/Project');

const getClients = async (req, res) => {
    try {
        // Query to find clients for specific brand or all user's brands
        const brands = await Brand.find({ owner: req.user._id });
        const brandIds = brands.map(b => b._id);
        
        const filter = { brandId: { $in: brandIds } };
        if (req.query.brandId) {
            filter.brandId = req.query.brandId;
        }

        const clients = await Client.find(filter).populate('brandId', 'name');
        res.status(200).json(clients);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const createClient = async (req, res) => {
    try {
        const { name, phone, email, eventDate, notes, brandId } = req.body;
        
        if (!name || !brandId) {
            res.status(400);
            throw new Error('Name and Brand ID are required');
        }

        // Verify the brand belongs to the user
        const brand = await Brand.findById(brandId);
        if(!brand || brand.owner.toString() !== req.user.id) {
             res.status(401);
             throw new Error('Not authorized for this brand');
        }

        const client = await Client.create({
            name, phone, email, eventDate, notes, brandId
        });

        // Initialize corresponding project for Pixsoffice workflow
        await Project.create({
            name: `${name}'s Event`,
            client: client._id,
            description: notes || `Production timeline for ${name}`,
            brandId: brandId,
            status: 'pending',
            allowedClients: [client._id]
        });

        res.status(201).json(client);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            res.status(404);
            throw new Error('Client not found');
        }

        const brand = await Brand.findById(client.brandId);
        if(!brand || brand.owner.toString() !== req.user.id) {
             res.status(401);
             throw new Error('Not authorized to update this client');
        }

        const updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedClient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            res.status(404);
            throw new Error('Client not found');
        }

        const brand = await Brand.findById(client.brandId);
        if(!brand || brand.owner.toString() !== req.user.id) {
             res.status(401);
             throw new Error('Not authorized to delete this client');
        }

        await client.deleteOne();
        res.status(200).json({ id: req.params.id, message: "Client deleted" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id).populate('brandId', 'name');
        if (!client) {
            res.status(404);
            throw new Error('Client not found');
        }

        const brand = await Brand.findById(client.brandId);
        if (!brand || brand.owner.toString() !== req.user.id) {
            res.status(401);
            throw new Error('Not authorized to view this client');
        }

        res.status(200).json(client);
    } catch (error) {
        res.status(res.statusCode === 200 ? 500 : res.statusCode).json({ message: error.message });
    }
};

module.exports = { getClients, createClient, updateClient, deleteClient, getClientById };
