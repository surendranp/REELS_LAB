import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import ffmpegPath from 'ffmpeg-static';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegPath);

async function downloadImage(imageUrl, outputPath) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from ${imageUrl}, status: ${response.status}`);
        }
        const buffer = await response.buffer();
        fs.writeFileSync(outputPath, buffer);
        console.log(`Downloaded image: ${outputPath}`);
    } catch (error) {
        console.error(`Error downloading image from ${imageUrl}:`, error);
        throw error;
    }
}

async function createReel(images, voiceOverPath, duration) {
    const outputDir = path.join(__dirname, '../output');
    const outputPath = path.join(outputDir, 'reel.mp4');

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Log the FFmpeg path to ensure it's set correctly
    console.log('FFmpeg path:', ffmpegPath);

    // Download related images from URLs
    const tempImageFiles = [];
    await Promise.all(images.slice(1).map(async (imageUrl, index) => {
        const outputFilePath = path.join(__dirname, '../uploads', `image${index}.jpg`);
        try {
            await downloadImage(imageUrl, outputFilePath);
            tempImageFiles.push(outputFilePath);
        } catch (error) {
            console.error(`Failed to download image ${imageUrl}:`, error);
        }
    }));

    // Add the user-uploaded image as the first in the array of images
    const allImages = [images[0], ...tempImageFiles];

    // Ensure the voiceover file exists
    if (!fs.existsSync(voiceOverPath)) {
        console.error('Voiceover file not found:', voiceOverPath);
        throw new Error('Voiceover file not found.');
    }

    // Log input files for debugging
    console.log('Input files for FFmpeg:');
    allImages.forEach((img, index) => {
        if (fs.existsSync(img)) {
            console.log(`Image ${index}: ${img}`);
        } else {
            console.warn(`Image ${index} does not exist: ${img}`);
        }
    });
    console.log(`Voiceover Path: ${voiceOverPath}`);

    // Check if all images exist before running FFmpeg
    const allFilesExist = allImages.every(file => fs.existsSync(file));
    if (!allFilesExist) {
        throw new Error('One or more input files do not exist. Cannot proceed with FFmpeg.');
    }

    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        // Add the user-uploaded image first
        command.input(images[0]).inputOptions([`-t ${duration / allImages.length}`]);

        // Add related images as inputs
        tempImageFiles.forEach((file) => {
            command.input(file).inputOptions([`-t ${duration / allImages.length}`]);
        });

        // Add voiceover as audio input
        command.input(voiceOverPath);

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
            .on('start', (cmdline) => {
                console.log('FFmpeg command started:', cmdline);  // Log FFmpeg command
            })
            .on('progress', (progress) => {
                console.log(`Processing: ${progress.percent}% done`); // Log progress
            })
            .on('end', () => {
                console.log('Reel video successfully created:', outputPath);
                tempImageFiles.forEach(file => fs.unlinkSync(file)); // Clean up temp image files
                resolve(outputPath);
            })
            .on('error', (err, stdout, stderr) => {
                console.error('Error creating reel video:', err.message);
                console.error('FFmpeg stdout:', stdout);
                console.error('FFmpeg stderr:', stderr);
                tempImageFiles.forEach(file => fs.unlinkSync(file)); // Clean up on error
                reject(err);
            })
            .run(); // Start FFmpeg processing
    });
}

export { createReel };
