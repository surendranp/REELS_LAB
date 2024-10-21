import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'; // Import createFFmpeg and fetchFile
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

const ffmpeg = createFFmpeg({ log: true }); // Create an instance of FFmpeg

// Function to create a reel from images and voiceover
async function createReel(images, voiceOver, duration) {
    await ffmpeg.load(); // Load the ffmpeg.wasm

    const outputPath = path.join(process.cwd(), 'output', 'reel.mp4'); // Path to the output video
    const tempImageFiles = images.map((_, index) => {
        return path.join(process.cwd(), 'uploads', `image${index}.jpg`); // Temporary image file path
    });

    // Download images to local filesystem
    await Promise.all(images.map(async (imageUrl, index) => {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.statusText}`);
            }
            const buffer = await response.buffer();
            fs.writeFileSync(tempImageFiles[index], buffer);
        } catch (error) {
            console.error(`Error downloading image ${index}:`, error);
            throw error;
        }
    }));

    // Prepare FFmpeg commands
    for (let i = 0; i < tempImageFiles.length; i++) {
        ffmpeg.FS('writeFile', `image${i}.jpg`, await fetchFile(tempImageFiles[i]));
    }
    
    if (fs.existsSync(voiceOver)) {
        ffmpeg.FS('writeFile', 'voiceover.mp3', await fetchFile(voiceOver));
    } else {
        throw new Error('Voiceover file not found.');
    }

    await ffmpeg.run('-framerate', '1', '-i', 'image%d.jpg', '-i', 'voiceover.mp3', '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p', outputPath);

    // Clean up temporary files
    tempImageFiles.forEach(file => fs.unlinkSync(file));
    return outputPath; // Return the output path
}

export { createReel };
