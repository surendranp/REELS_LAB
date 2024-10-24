import express from 'express';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs'; // Import the 'fs' module
import { generateRelatedImages } from './imageGenerator.js';

dotenv.config();

const app = express();
const uploadsDir = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists 
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created:', uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(process.cwd(), 'public')));

// Endpoint to handle reel creation
app.post('/create-reel', upload.single('userImage'), async (req, res) => {
    try {
        const { duration } = req.body;
        const query = req.file.filename; // Use the uploaded image filename as the query

        const relatedImages = await generateRelatedImages(query);
        res.json({ relatedImages });
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
