const fetch = require('node-fetch');
const { ELEVEN_LABS_API_KEY } = process.env; // Make sure this is correctly set in your .env file

async function generateVoiceOver(text) {
    const url = 'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM'; // Correct endpoint for generating voiceover
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ELEVEN_LABS_API_KEY}`, // Correct header for Eleven Labs API
    };

    const body = JSON.stringify({
        text: text,
        voice: '21m00Tcm4TlvDq8ikWAM', // Your actual voice ID
    });

    console.log('Sending voiceover request to Eleven Labs:', body);

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
    });

    if (!response.ok) {
        const errorText = await response.text(); // Capture error message from response
        console.error('Error generating voiceover:', response.status, errorText);
        throw new Error(`Failed to generate voiceover: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.audio_url;
}

module.exports = { generateVoiceOver };
