import ffmpeg from 'fluent-ffmpeg'; // Use fluent-ffmpeg
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import ffmpegPath from 'ffmpeg-static'; // Use ffmpeg-static for the FFmpeg path
import { fileURLToPath } from 'url'; // Import for dirname functionality

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegPath); // Set the path to FFmpeg

// Function to create a reel from images and voiceover
async function createReel(images, voiceOver, duration) {
    const outputDir = path.join(__dirname, '../output'); // Path to the output directory
    const outputPath = path.join(outputDir, 'reel.mp4'); // Path to the output video

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log('Output directory created:', outputDir);
    }

    const tempImageFiles = images.map((_, index) => {
        return path.join(__dirname, '../uploads', `image${index}.jpg`); // Temporary image file path
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

    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        // Add each image as an input with a fixed duration
        tempImageFiles.forEach((file, index) => {
            command.input(file).inputOptions([`-t ${duration / tempImageFiles.length}`]); // Divide the total duration by number of images
        });

        // Add the voiceover as an audio track
        if (fs.existsSync(voiceOver)) {
            command.input(voiceOver);
        } else {
            console.error('Voiceover file not found.');
            reject(new Error('Voiceover file not found.'));
        }

        // Set FFmpeg options for video and audio
        command.outputOptions([
            '-r 30', // Set frame rate to 30 FPS
            '-c:v libx264', // Codec for video
            '-c:a aac', // Codec for audio
            '-pix_fmt yuv420p', // Set pixel format for compatibility
            '-shortest', // Stops when the shortest input (audio or video) ends
            '-movflags +faststart' // Web video compatibility
        ])
        .output(outputPath)
        .on('end', () => {
            console.log('Video successfully created:', outputPath);
            // Cleanup temporary image files
            tempImageFiles.forEach(file => fs.unlinkSync(file));
            resolve(outputPath);
        })
        .on('error', (err) => {
            console.error('Error creating reel:', err.message);
            // Cleanup temporary image files on error
            tempImageFiles.forEach(file => fs.unlinkSync(file));
            reject(err);
        })
        .run();
    });
}

export { createReel };
