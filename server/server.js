const express = require('express');
const createVideo = require('./videoCreator'); // Use require to import the function

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Sample route for creating a reel
app.post('/generate-reel', async (req, res) => {
    const { images, duration } = req.body;
    try {
        const videoPath = await createVideo(images, duration);
        res.status(200).json({ message: 'Reel created successfully!', videoPath });
    } catch (error) {
        console.error('Error in /generate-reel route:', error);
        res.status(500).json({ error: 'Error creating reel' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
