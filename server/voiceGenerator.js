import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const { ELEVEN_LABS_API_KEY } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateVoiceOver(text) {
    const voiceId = '21m00Tcm4TlvDq8ikWAM';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    const headers = {
        'Content-Type': 'application/json',
        'xi-api-key': `${ELEVEN_LABS_API_KEY.trim()}`,
    };

    console.log('Using ELEVEN_LABS_API_KEY:', ELEVEN_LABS_API_KEY);

    const body = JSON.stringify({
        text: text,
        voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75
        }
    });

    console.log('Sending voiceover request to Eleven Labs:', body);

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error generating voiceover:', response.status, errorText);
        throw new Error(`Failed to generate voiceover: ${response.status} ${response.statusText}`);
    }

    const data = await response.arrayBuffer();

    const voiceoverPath = path.join(__dirname, '../uploads', 'voiceover.mp3');
    fs.writeFileSync(voiceoverPath, Buffer.from(data));

    console.log('Voiceover saved at:', voiceoverPath);

    // Check if the voiceover file has content
    if (fs.statSync(voiceoverPath).size > 0) {
        console.log('Voiceover saved successfully.');
    } else {
        console.error('Voiceover file is empty.');
        throw new Error('Voiceover file is empty.');
    }

    return voiceoverPath;
}

export { generateVoiceOver };
