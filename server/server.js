const express = require('express');
const multer = require('multer');
const path = require('path');
const { generateRelatedImages } = require('./imageGenerator');
const { generateVoiceOver } = require('./voiceGenerator');
const { createReel } = require('./videoCreator');

require('dotenv').config();

const app = express();
const upload = multer({ dest: path.join(__dirname, '../uploads') }); // Upload path

// Serve static files from the output directory
app.use('/output', express.static(path.join(__dirname, '../output')));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Route for reel generation
app.post('/generate-reel', upload.single('image'), async (req, res) => {
    const { description, duration } = req.body;
    const uploadedImage = req.file.path;

    try {
        const query = description.split(' ')[0]; // Example: using the first word as the query
        const relatedImages = await generateRelatedImages(query);
        const voiceOver = await generateVoiceOver(description);
        const reel = await createReel(relatedImages, voiceOver, duration);

        res.json({ message: 'Reel generated!', reel: `/output/${path.basename(reel)}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Error generating reel.' });
    }
});

// Serve index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html')); // Adjusted to go one level up
});

// Use dynamic port for Railway deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});