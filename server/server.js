import express from 'express';
import multer from 'multer';
import path from 'path';
import { generateRelatedImages } from './imageGenerator.js';
import { generateVoiceOver } from './voiceGenerator.js';
import { createReel } from './videoCreator.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const uploadsDir = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created:', uploadsDir);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // Save uploaded files to the uploads directory
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep original filename
    },
});
const upload = multer({ storage: storage });

// Endpoint to handle reel creation
app.post('/create-reel', upload.single('userImage'), async (req, res) => {
    try {
        const { description, duration } = req.body;
        const userImagePath = req.file.path;

        // Extract query from description
        const query = description; // Adjust this as needed to extract relevant keywords

        const relatedImages = await generateRelatedImages(query);
        const voiceOverPath = await generateVoiceOver(description);

        const finalVideoPath = await createReel(relatedImages, userImagePath, voiceOverPath, duration);

        res.json({ message: 'Reel created successfully!', videoPath: finalVideoPath });
    } catch (error) {
        console.error('Error in /create-reel:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
