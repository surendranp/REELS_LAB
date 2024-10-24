import express from 'express';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { generateRelatedImages } from './imageGenerator.js';
import { createVideo } from './videoCreator.js';

dotenv.config();
const app = express();
const uploadsDir = path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

app.use(express.static(path.join(process.cwd(), 'public')));

app.post('/create-video', upload.single('sampleImage'), async (req, res) => {
    try {
        const query = req.file.filename; // Use the uploaded file name or another logic to derive query
        const relatedImages = await generateRelatedImages(query);

        // Create video with a duration of 30 seconds
        const videoPath = await createVideo(relatedImages);

        res.json({ videoPath });
    } catch (error) {
        console.error('Error in /create-video:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
