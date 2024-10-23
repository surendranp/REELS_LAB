import fetch from 'node-fetch'; // Using ES module syntax
const { UNSPLASH_ACCESS_KEY } = process.env;

/**
 * Fetches related images from Unsplash based on a search query.
 * @param {string} query - The search query for fetching images.
 * @param {number} limit - Maximum number of images to fetch.
 * @returns {Promise<string[]>} - A promise that resolves to an array of image URLs.
 */
async function generateRelatedImages(query, limit = 5) {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=${limit}`;
    console.log('Fetching images from Unsplash:', url); // Log the request URL
    
    try {
        const response = await fetch(url);

        // Check if the response is ok
        if (!response.ok) {
            const errorText = await response.text(); // Capture response text for better debugging
            console.error('Error fetching from Unsplash:', response.status, errorText);

            // Optionally check for rate limit headers and log them
            const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
            const rateLimitReset = response.headers.get('x-ratelimit-reset');
            console.error(`Rate Limit Remaining: ${rateLimitRemaining}, Reset at: ${new Date(rateLimitReset * 1000)}`);

            throw new Error(`Failed to fetch images from Unsplash: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Handle case where no images are found
        if (!data.results || data.results.length === 0) {
            console.warn('No images found for query:', query);
            return [];
        }

        // Map results to regular-sized image URLs
        return data.results.slice(0, limit).map(image => image.urls.regular);

    } catch (error) {
        console.error('Error during Unsplash API call:', error);
        throw error;
    }
}

export { generateRelatedImages };
