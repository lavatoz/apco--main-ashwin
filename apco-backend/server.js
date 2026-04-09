const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load env variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));

// Root route
app.get('/', (req, res) => {
    res.send('APCO API is running...');
});

// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
