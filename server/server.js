const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { generateVoiceOver } = require('./voiceGenerator'); // Assuming you have a voice generator module

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files

// Endpoint to generate a reel
app.post('/generate-reel', async (req, res) => {
    const { imageUrl, description, duration } = req.body;

    if (!imageUrl || !description || !duration) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // Extract query for Unsplash API from the description
        const query = extractQueryFromDescription(description);

        // Fetch additional images from Unsplash
        const unsplashImages = await fetchUnsplashImages(query);
        
        // Generate voice-over using Eleven Labs API
        const voiceOver = await generateVoiceOver(description);

        // Combine images and voice-over into a reel (this is where you would implement your reel generation logic)

        res.status(200).json({ success: true, images: unsplashImages, voiceOver });
    } catch (error) {
        console.error('Error generating reel:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Function to extract query from description
function extractQueryFromDescription(description) {
    // Implement your logic to extract a query from the description
    return description.split(' ').slice(0, 3).join(' '); // Example: take the first 3 words
}

// Function to fetch images from Unsplash API
async function fetchUnsplashImages(query) {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=YOUR_UNSPLASH_API_KEY`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch images from Unsplash');
    }

    const data = await response.json();
    return data.results.map(image => image.urls.small); // Return small image URLs
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
