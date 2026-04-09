const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const BrandSchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    role: { type: String, enum: ['admin', 'client', 'staff'], default: 'admin' }
});

const Brand = mongoose.models.Brand || mongoose.model('Brand', BrandSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const brandsToAdd = ['AAHA Kalyanam', 'Tiny Toes'];

const seed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('Admin user not found. Please create an admin user first by signing up.');
            process.exit(1);
        }

        console.log(`Using admin user: ${admin._id}`);

        for (const name of brandsToAdd) {
            const existing = await Brand.findOne({ name, owner: admin._id });
            if (!existing) {
                await Brand.create({ name, owner: admin._id });
                console.log(`✅ Added brand: ${name}`);
            } else {
                console.log(`ℹ️ Brand already exists: ${name}`);
            }
        }

        console.log('✅ Seeding completed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seed();
