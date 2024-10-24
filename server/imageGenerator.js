import fetch from 'node-fetch';
const { UNSPLASH_ACCESS_KEY } = process.env;

console.log('Unsplash Access Key:', UNSPLASH_ACCESS_KEY); // Log the access key for debugging

async function generateRelatedImages(query) {
    const url = `https://api.unsplash.com/search/photos?query=${query}&client_id=${UNSPLASH_ACCESS_KEY}`;
    console.log('Fetching images from Unsplash:', url); // Log the request URL
    
    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text(); // Capture response text for better debugging
        console.error('Error fetching from Unsplash:', response.status, errorText);
        throw new Error(`Failed to fetch images from Unsplash: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.map(image => image.urls.regular);
}

export { generateRelatedImages };
