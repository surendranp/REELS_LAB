import express from 'express';
import { createReel } from './videoCreator.js';
import formidable from 'formidable';

const app = express();

app.use(express.json());

app.post('/create-reel', async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).send('Error parsing form data');
        }

        const { images, voiceOverPath, duration } = fields;  // Assuming the user inputs these fields
        try {
            await createReel(images, voiceOverPath, duration);
            res.status(200).send('Reel created successfully!');
        } catch (error) {
            res.status(500).send('Error creating reel: ' + error.message);
        }
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
