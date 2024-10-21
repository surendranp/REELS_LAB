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
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    const { description, duration } = req.body;
    const userImagePath = req.file.path;  // User-uploaded image

    try {
        const query = description.split(' ')[0];
        console.log('Query for related images:', query);

        const relatedImages = await generateRelatedImages(query);
        console.log('Related images:', relatedImages);

        const voiceOver = await generateVoiceOver(description);
        console.log('Voiceover saved at:', voiceOver);

        const reel = await createReel(relatedImages, userImagePath, voiceOver, duration);
        console.log('Reel created at:', reel);

        res.json({ message: 'Reel generated!', reel: `/output/${path.basename(reel)}` });
    } catch (error) {
        console.error('Error in /generate-reel route:', error);
        res.status(500).json({ message: error.message || 'Error generating reel.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
