const fetch = require('node-fetch');
const { ELEVEN_LABS_API_KEY } = process.env;

async function generateVoiceOver(text) {
    const url = 'https://api.elevenlabs.io/v1/text-to-speech/generate';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ELEVEN_LABS_API_KEY.trim()}`, // Ensure no extra spaces
    };

    const body = JSON.stringify({
        text: text,
        voice: '21m00Tcm4TlvDq8ikWAM', // Replace with your actual voice ID
    });

    console.log('Sending voiceover request to Eleven Labs:', body); // Log the request body

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
    });

    if (!response.ok) {
        const errorText = await response.text(); // Capture response text for debugging
        console.error('Error generating voiceover:', response.status, errorText);
        throw new Error(`Failed to generate voiceover: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.audio_url; // Adjust based on the actual response structure
}

module.exports = { generateVoiceOver };
