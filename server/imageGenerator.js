const fetch = require('node-fetch');

// Function to generate related images from Unsplash
async function generateRelatedImages(query) {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${process.env.UNSPLASH_API_KEY}`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch images from Unsplash');
    }

    const data = await response.json();
    return data.results.map(image => image.urls.small); // Return small image URLs
}

module.exports = { generateRelatedImages };
