const fetch = require('node-fetch');
const { ELEVEN_LABS_API_KEY } = process.env;

async function generateVoiceOver(text) {
    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Replace with your actual voice ID
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const headers = {
        'Content-Type': 'application/json',
        'xi-api-key': `${ELEVEN_LABS_API_KEY.trim()}`, // Correct key for authorization
    };

    console.log('Using ELEVEN_LABS_API_KEY:', ELEVEN_LABS_API_KEY); // Log the API key for debugging
    const body = JSON.stringify({
        text: text,
        voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75
        }
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

    const data = await response.arrayBuffer(); // Audio data is returned as array buffer
    return Buffer.from(data); // Convert array buffer to Buffer for further use
}

module.exports = { generateVoiceOver };
