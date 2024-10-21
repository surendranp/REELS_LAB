const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { ELEVEN_LABS_API_KEY } = process.env;

async function generateVoiceOver(text) {
    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Ensure this is the correct voice ID for your use case
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    // Use the correct API key header for Eleven Labs
    const headers = {
        'Content-Type': 'application/json',
        'xi-api-key': `${ELEVEN_LABS_API_KEY.trim()}`, // Ensure no extra spaces in the API key
    };

    console.log('Using ELEVEN_LABS_API_KEY:', ELEVEN_LABS_API_KEY); // Log API key for debugging

    // Body containing the text and voice settings
    const body = JSON.stringify({
        text: text,
        voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75
        }
    });

    console.log('Sending voiceover request to Eleven Labs:', body); // Log request body for debugging

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
    });

    if (!response.ok) {
        const errorText = await response.text(); // Capture the response error for debugging
        console.error('Error generating voiceover:', response.status, errorText);
        throw new Error(`Failed to generate voiceover: ${response.status} ${response.statusText}`);
    }

    const data = await response.arrayBuffer(); // Get the audio data as an array buffer

    // Save the audio buffer to a file
    const voiceoverPath = path.join(__dirname, '../uploads', 'voiceover.mp3'); // Path to save voiceover
    fs.writeFileSync(voiceoverPath, Buffer.from(data)); // Write buffer data to file

    console.log('Voiceover saved at:', voiceoverPath); // Log the saved file path

    return voiceoverPath; // Return the saved file path for further use in video creation
}

module.exports = { generateVoiceOver };
