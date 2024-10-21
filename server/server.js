import express from 'express';
import multer from 'multer';
import path from 'path';
import { generateRelatedImages } from './imageGenerator.js'; // Note the .js extension
import { generateVoiceOver } from './voiceGenerator.js'; // Note the .js extension
import { createReel } from './videoCreator.js'; // Note the .js extension

require('dotenv').config();

const app = express();
const upload = multer({ dest: path.join(process.cwd(), 'uploads') }); // Upload path

// Serve static files from the output directory
app.use('/output', express.static(path.join(process.cwd(), 'output')));

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Route for reel generation
app.post('/generate-reel', upload.single('image'), async (req, res) => {
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    const { description, duration } = req.body;
    const uploadedImage = req.file.path;

    try {
        const query = description.split(' ')[0]; // Example: using the first word as the query
        console.log('Query for related images:', query);

        const relatedImages = await generateRelatedImages(query);
        console.log('Related images:', relatedImages);

        const voiceOver = await generateVoiceOver(description);
        console.log('Voiceover saved at:', voiceOver);

        const reel = await createReel(relatedImages, voiceOver, duration);
        console.log('Reel created at:', reel);

        res.json({ message: 'Reel generated!', reel: `/output/${path.basename(reel)}` });
    } catch (error) {
        console.error('Error in /generate-reel route:', error);
        res.status(500).json({ message: error.message || 'Error generating reel.' });
    }
});

// Serve index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html')); // Adjusted to go one level up
});

// Use dynamic port for Railway deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
