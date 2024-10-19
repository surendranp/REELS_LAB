const axios = require('axios');

async function generateRelatedImages(imagePath) {
    // Extract a keyword from the uploaded image name (or a description)
    const query = 'nature'; // Example: use a keyword or description from user input

    const response = await axios.get(`https://api.unsplash.com/search/photos`, {
        params: { query: query, client_id: process.env.UNSPLASH_ACCESS_KEY, per_page: 3 }
    });

    // Return URLs of images
    return response.data.results.map(image => image.urls.small);
}

module.exports = { generateRelatedImages };
