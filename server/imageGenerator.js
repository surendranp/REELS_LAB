import fetch from 'node-fetch'; // Using ES module syntax
const { UNSPLASH_ACCESS_KEY } = process.env;

/**
 * Fetches related images from Unsplash based on a search query.
 * @param {string} query - The search query for fetching images.
 * @returns {Promise<string[]>} - A promise that resolves to an array of image URLs.
 */
async function generateRelatedImages(query) {
    const url = `https://api.unsplash.com/search/photos?query=${query}&client_id=${UNSPLASH_ACCESS_KEY}`;
    console.log('Fetching images from Unsplash:', url); // Log the request URL
    
    const response = await fetch(url);

    // Check if the response is ok
    if (!response.ok) {
        const errorText = await response.text(); // Capture response text for better debugging
        console.error('Error fetching from Unsplash:', response.status, errorText);
        throw new Error(`Failed to fetch images from Unsplash: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.map(image => image.urls.regular);
}

export { generateRelatedImages }; // Changed to ES module export
