import fetch from 'node-fetch';

export const generateRelatedImages = async (query) => {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${query}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch images from Unsplash: ${response.statusText}`);
    }
    const data = await response.json();
    return data.results.map(image => image.urls.regular); // Return an array of image URLs
};
