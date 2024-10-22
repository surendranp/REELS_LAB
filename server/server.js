import express from 'express';
import multer from 'multer';
import path from 'path';
import { generateRelatedImages } from './imageGenerator.js';
import { generateVoiceOver } from './voiceGenerator.js';
import { createReel } from './videoCreator.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({ dest: path.join(process.cwd(), 'uploads') });

app.use('/output', express.static(path.join(process.cwd(), 'output')));
app.use(express.static(path.join(process.cwd(), 'public')));

app.post('/generate-reel', upload.single('image'), async (req, res) => {
    const { description, duration } = req.body;
    const userImagePath = req.file.path;  // Path of the user-uploaded image

    try {
        const query = description.split(' ')[0];  // Extract the query from the description

        // Generate related images using the Unsplash API
        const relatedImages = await generateRelatedImages(query);

        // Generate the voiceover using the Eleven Labs API
        const voiceOverPath = await generateVoiceOver(description);

        // Create the reel video with the images and voiceover
        const reelPath = await createReel(relatedImages, userImagePath, voiceOverPath, duration);

        res.json({ message: 'Reel successfully generated!', reelUrl: `/output/${path.basename(reelPath)}` });
    } catch (error) {
        console.error('Error generating reel:', error);
        res.status(500).json({ message: 'Error generating reel', error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
