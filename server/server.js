import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateRelatedImages } from './imageGenerator.js';
import { generateVoiceOver } from './voiceGenerator.js';
import { createReel } from './videoCreator.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({ dest: path.join(process.cwd(), 'uploads') });

// Ensure the output directory exists
const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('Output directory created:', outputDir);
}

app.use('/output', express.static(outputDir));
app.use(express.static(path.join(process.cwd(), 'public')));

app.post('/generate-reel', upload.single('image'), async (req, res) => {
    const { description, duration } = req.body;
    const userImagePath = req.file.path; // Path of the user-uploaded image

    try {
        // Ensure the duration is a valid number
        const reelDuration = parseFloat(duration);
        if (isNaN(reelDuration) || reelDuration <= 0) {
            throw new Error('Invalid duration');
        }

        // Extract query from the description
        const query = description.split(' ')[0]; // Example: using the first word as the query

        // Generate related images using the Unsplash API
        const relatedImages = await generateRelatedImages(query);
        if (relatedImages.length === 0) {
            throw new Error('No related images found.');
        }

        // Generate the voiceover using the Eleven Labs API
        const voiceOverPath = await generateVoiceOver(description);
        if (!fs.existsSync(voiceOverPath)) {
            throw new Error('Failed to generate voiceover.');
        }

        // Create the reel video with the images and voiceover
        const reelPath = await createReel([userImagePath, ...relatedImages], voiceOverPath, reelDuration);
        if (!fs.existsSync(reelPath)) {
            throw new Error('Failed to create reel.');
        }

        // Return the URL to the generated reel
        res.json({ message: 'Reel successfully generated!', reelUrl: `/output/${path.basename(reelPath)}` });
    } catch (error) {
        console.error('Error generating reel:', error);
        res.status(500).json({ message: 'Error generating reel', error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Start server with dynamic port handling for deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
