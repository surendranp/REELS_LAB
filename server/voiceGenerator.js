const axios = require('axios');
const fs = require('fs');

async function generateVoiceOver(description) {
    try {
        const response = await axios.post('https://api.elevenlabs.io/v1/text-to-speech/generate', {
            text: description, // Use the input description as the text
            voice: "en-us"
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.ELEVEN_LABS_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const audioPath = 'output/output.mp3';
        // Ensure the output directory exists
        fs.mkdirSync('output', { recursive: true });
        fs.writeFileSync(audioPath, response.data.audioContent, 'base64');

        return audioPath; // Return path to the audio file
    } catch (error) {
        console.error('Error generating voice over:', error.response ? error.response.data : error.message);
        throw error; // Rethrow the error for further handling if needed
    }
}

module.exports = { generateVoiceOver };
