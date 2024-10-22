import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import ffmpegPath from 'ffmpeg-static';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegPath);

async function createReel(images, userImagePath, voiceOverPath, duration) {
    const outputDir = path.join(__dirname, '../output');
    const outputPath = path.join(outputDir, 'reel.mp4');

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Define temporary paths for images to be downloaded
    const tempImageFiles = images.map((_, index) => {
        return path.join(__dirname, '../uploads', `image${index}.jpg`);
    });

    // Add the user-uploaded image as the first in the array of images
    const allImages = [userImagePath, ...images];

    // Download related images from URLs
    await Promise.all(images.map(async (imageUrl, index) => {
        try {
            const response = await fetch(imageUrl);
            const buffer = await response.buffer();
            fs.writeFileSync(tempImageFiles[index], buffer);
        } catch (error) {
            console.error(`Failed to download image ${index}: ${error}`);
            throw error;
        }
    }));

    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        // Add the user-uploaded image first
        command.input(userImagePath).inputOptions([`-t ${duration / allImages.length}`]);

        // Add related images as inputs
        tempImageFiles.forEach((file, index) => {
            command.input(file).inputOptions([`-t ${duration / allImages.length}`]);
        });

        // Check if the voiceover file exists
        if (fs.existsSync(voiceOverPath)) {
            command.input(voiceOverPath); // Add the voiceover audio input
        } else {
            console.error('Voiceover file not found:', voiceOverPath);
            reject(new Error('Voiceover file not found.'));
            return;
        }

        // Set output options for video encoding
        command
            .outputOptions([
                '-r 30', // 30 FPS
                '-c:v libx264', // Video codec
                '-c:a aac', // Audio codec
                '-pix_fmt yuv420p', // Pixel format
                '-shortest', // Shorten the video to match the length of the shortest input (voiceover)
                '-movflags +faststart', // Optimize for web playback
            ])
            .output(outputPath) // Set the output file
            .on('end', () => {
                console.log('Reel video successfully created:', outputPath);
                tempImageFiles.forEach(file => fs.unlinkSync(file)); // Clean up temp image files
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('Error creating reel video:', err);
                tempImageFiles.forEach(file => fs.unlinkSync(file)); // Clean up on error
                reject(err);
            })
            .run(); // Start FFmpeg processing
    });
}

export { createReel };
