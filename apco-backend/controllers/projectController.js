const Project = require('../models/Project');
const Brand = require('../models/Brand');
const Client = require('../models/Client');

const getProjects = async (req, res) => {
    try {
        let filter = {};
        
        if (req.user.role === 'admin') {
            const brands = await Brand.find({ owner: req.user._id });
            const brandIds = brands.map(b => b._id);
            filter = { brandId: { $in: brandIds } };
            if (req.query.brandId) {
                filter.brandId = req.query.brandId;
            }
        } else {
            // Find the client linked to this user
            const client = await Client.findOne({ userId: req.user._id });
            if (!client) {
                return res.status(200).json([]); // No profile linked
            }
            filter = { allowedClients: client._id };
        }

        const projects = await Project.find(filter)
            .populate('client', 'name email')
            .populate('brandId', 'name')
            .populate('allowedClients', 'name email');
            
        res.status(200).json(projects);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const createProject = async (req, res) => {
    try {
        const { name, client, description, brandId } = req.body;
        
        if (!name || !client || !brandId) {
            res.status(400);
            throw new Error('Name, Client ID, and Brand ID are required');
        }

        const project = await Project.create({
            name, client, description, brandId,
            allowedClients: [client] // Auto-assign the primary client
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('client')
            .populate('brandId')
            .populate('allowedClients', 'name email');
            
        if (!project) {
            res.status(404);
            throw new Error('Project not found');
        }
        res.status(200).json(project);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const assignClient = async (req, res) => {
    try {
        const { clientId } = req.body;
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            res.status(404);
            throw new Error('Project not found');
        }

        // Avoid duplicates
        if (!project.allowedClients.includes(clientId)) {
            project.allowedClients.push(clientId);
            await project.save();
        }

        const updated = await Project.findById(project._id)
            .populate('client')
            .populate('brandId')
            .populate('allowedClients', 'name email');
            
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const removeClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            res.status(404);
            throw new Error('Project not found');
        }

        project.allowedClients = project.allowedClients.filter(c => c.toString() !== clientId);
        await project.save();

        const updated = await Project.findById(project._id)
            .populate('client')
            .populate('brandId')
            .populate('allowedClients', 'name email');
            
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateProjectStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.status = status;
        await project.save();
        res.status(200).json(project);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const uploadImages = async (req, res) => {
    try {
        const { imageUrls } = req.body; // Expecting array of strings
        if (!imageUrls || !Array.isArray(imageUrls)) {
            return res.status(400).json({ message: 'Image URLs array is required' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const newImages = imageUrls.map(url => ({ url }));
        project.images.push(...newImages);
        project.status = 'uploaded';
        await project.save();

        res.status(200).json(project);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const toggleImageSelection = async (req, res) => {
    try {
        const { imageId } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const image = project.images.id(imageId);
        if (!image) return res.status(404).json({ message: 'Image not found' });

        image.isSelected = !image.isSelected;
        
        // If all selected or at least one, we could change status to 'selected'
        const anySelected = project.images.some(img => img.isSelected);
        if (anySelected && project.status === 'uploaded') {
            project.status = 'selected';
        }
        
        await project.save();
        res.status(200).json(project);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { 
    getProjects, 
    createProject, 
    getProjectById, 
    assignClient, 
    removeClient,
    updateProjectStatus,
    uploadImages,
    toggleImageSelection
};
