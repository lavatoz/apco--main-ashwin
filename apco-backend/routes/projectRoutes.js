const express = require('express');
const router = express.Router();
const { 
    getProjects, 
    createProject, 
    getProjectById, 
    assignClient, 
    removeClient,
    updateProjectStatus,
    uploadImages,
    toggleImageSelection 
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { auditLogger } = require('../middleware/auditMiddleware');

router.route('/')
    .get(protect, getProjects)
    .post(protect, authorize('admin', 'staff'), auditLogger('Create Project', 'ProjectUpdate'), createProject);

router.route('/:id')
    .get(protect, getProjectById);

router.route('/:id/status')
    .put(protect, auditLogger('Update Project Status', 'ProjectUpdate'), updateProjectStatus);

router.route('/:id/upload')
    .post(protect, uploadImages);

router.route('/:id/select')
    .post(protect, toggleImageSelection);

router.route('/:id/assign-client')
    .put(protect, assignClient);

router.route('/:id/remove-client/:clientId')
    .delete(protect, removeClient);

module.exports = router;
