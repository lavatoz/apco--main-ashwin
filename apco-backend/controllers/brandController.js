const Brand = require('../models/Brand');

const getBrands = async (req, res) => {
    try {
        const brands = await Brand.find({ owner: req.user._id });
        res.status(200).json(brands);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const createBrand = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            res.status(400);
            throw new Error('Please add a name field');
        }

        const brand = await Brand.create({
            name,
            owner: req.user._id,
        });

        res.status(201).json(brand);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            res.status(404);
            throw new Error('Brand not found');
        }

        if (brand.owner.toString() !== req.user.id) {
            res.status(401);
            throw new Error('User not authorized to update this brand');
        }

        const updatedBrand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedBrand);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            res.status(404);
            throw new Error('Brand not found');
        }

        if (brand.owner.toString() !== req.user.id) {
            res.status(401);
            throw new Error('User not authorized to delete this brand');
        }

        await brand.deleteOne();
        res.status(200).json({ id: req.params.id, message: "Brand deleted" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getBrands, createBrand, updateBrand, deleteBrand };
