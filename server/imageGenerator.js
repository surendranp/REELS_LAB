import fetch from 'node-fetch';

// Function to fetch related images from Unsplash
export const generateRelatedImages = async (query) => {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY; // Retrieve the Unsplash access key from environment variables
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${accessKey}`;

    console.log('Fetching from Unsplash:', url); // Log the request URL

    try {
        const response = await fetch(url);
        
        // Check if the response is not OK (e.g., Unauthorized)
        if (!response.ok) {
            throw new Error(`Failed to fetch images from Unsplash: ${response.statusText} (Status Code: ${response.status})`);
        }

        const data = await response.json();
        
        // Return an array of image URLs
        return data.results.map(image => image.urls.small);
    } catch (error) {
        console.error('Error fetching from Unsplash:', error);
        throw error; // Rethrow the error for handling in the calling function
    }
};
