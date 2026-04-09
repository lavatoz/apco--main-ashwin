const { spawn } = require('child_process');
const path = require('path');
const Gallery = require('../models/Gallery');
const Client = require('../models/Client');
const fs = require('fs');

// @desc    Find photos of a person using a selfie image
// @route   POST /api/ai/find-photos/:clientId
// @access  Private (Client only search their own images)
const findMyPhotos = async (req, res) => {
    try {
        const { clientId } = req.params;
        const selfie = req.file;

        if (!selfie) {
            return res.status(400).json({ message: 'Selfie image is required' });
        }

        // Security check: Verify clientId matches user's linked client record if they are a client
        if (req.user.role === 'client' || req.user.role === 'Client') {
            const clientRecord = await Client.findById(clientId);
            if (!clientRecord || (clientRecord.userId?.toString() !== req.user._id.toString())) {
               return res.status(403).json({ message: 'Not authorized to search this gallery' });
            }
        }

        const gallery = await Gallery.findOne({ clientId });
        if (!gallery || !gallery.images || gallery.images.length === 0) {
            return res.status(404).json({ message: 'No gallery images found for this client' });
        }

        const selfiePath = path.resolve(selfie.path);
        const imagePaths = gallery.images.map(img => path.resolve(img.path));

        console.log(`Starting AI search for client ${clientId} with ${imagePaths.length} images`);

        // Call Python script
        const pythonProcess = spawn('python', [
            path.join(__dirname, '../python-service/face_match.py'),
            selfiePath,
            ...imagePaths
        ]);

        let resultData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            resultData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
            console.error(`Python Error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`AI search process closed with code ${code}`);
            
            // Delete temp selfie after processing
            fs.unlink(selfiePath, (err) => {
                if (err) console.error('Error deleting temp selfie:', err);
            });

            if (code !== 0) {
                console.error(`AI Service failed. StdErr: ${errorData}`);
                return res.status(500).json({ message: 'Face recognition service failed. Please ensure python and face_recognition are installed.' });
            }

            try {
                const results = JSON.parse(resultData);
                if (results.error) {
                    return res.status(400).json({ message: results.error });
                }

                // results.matches contains absolute paths. We need to match them back to our relative paths stored in the gallery.
                // It's safer to compare based on filename or relative path rather than path-calculating since it's already in the OS' format.
                const matchedPaths = results.matches.map(absPath => {
                    const normalizedAbs = path.normalize(absPath);
                    const matchedImage = gallery.images.find(img => path.resolve(img.path) === normalizedAbs);
                    return matchedImage ? matchedImage.path : null;
                }).filter(p => p !== null);

                res.status(200).json({ matches: matchedPaths });
            } catch (err) {
                console.error('Failed to parse AI result:', err, 'Raw data:', resultData);
                res.status(500).json({ message: 'Failed to parse face recognition results' });
            }
        });

    } catch (error) {
        console.error('FindMyPhotos unexpected error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { findMyPhotos };
