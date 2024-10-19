const fetch = require('node-fetch');

// Function to generate voiceover using Eleven Labs API
async function generateVoiceOver(text) {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ELEVEN_LABS_API_KEY}`,
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate voiceover');
    }

    const data = await response.json();
    return data.audioUrl; // Assuming this returns a URL to the generated audio
}

module.exports = { generateVoiceOver };
