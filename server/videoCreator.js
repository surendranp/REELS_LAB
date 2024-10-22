import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import ffmpegPath from 'ffmpeg-static';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegPath);

async function createReel(images, userImagePath, voiceOver, duration) {
    const outputDir = path.join(__dirname, '../output');
    const outputPath = path.join(outputDir, 'reel.mp4');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log('Output directory created:', outputDir);
    } else {
        console.log('Output directory already exists:', outputDir);
    }

    // Prepare temporary image files array
    const tempImageFiles = await Promise.all(images.map((_, index) => {
        return path.join(__dirname, '../uploads', `image${index}.jpg`);
    }));

    // Download related images to local filesystem
    await Promise.all(images.map(async (imageUrl, index) => {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.statusText}`);
            }
            const buffer = await response.buffer();
            fs.writeFileSync(tempImageFiles[index], buffer);
            console.log(`Downloaded image ${index}:`, tempImageFiles[index]);
        } catch (error) {
            console.error(`Error downloading image ${index}:`, error);
            throw error; // Stop processing if an image fails to download
        }
    }));

    // Log input paths
    console.log('User image path:', userImagePath);
    console.log('Voiceover path:', voiceOver);
    tempImageFiles.forEach((file, index) => {
        console.log(`Image file ${index}:`, file);
    });

    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        // Add user image and related images to command
        command.input(userImagePath);
        tempImageFiles.forEach(file => {
            command.input(file);
        });

        // Add the voiceover as an audio track if it exists
        if (fs.existsSync(voiceOver)) {
            command.input(voiceOver);
        } else {
            console.error('Voiceover file not found.');
            reject(new Error('Voiceover file not found.'));
            return; // Exit if voiceover is missing
        }

        // Calculate duration per image
        const durationPerImage = duration / (tempImageFiles.length + 1); // +1 for user image

        // Set output options
        command.outputOptions([
            '-r 30', // 30 FPS
            '-c:v libx264',
            '-c:a aac',
            '-pix_fmt yuv420p',
            '-shortest',
            '-movflags +faststart',
            `-t ${durationPerImage}` // Set duration for each input
        ])
        .output(outputPath)
        .on('end', () => {
            console.log('Video successfully created:', outputPath);
            // Clean up temporary image files
            tempImageFiles.forEach(file => fs.unlinkSync(file));
            resolve(outputPath);
        })
        .on('error', (err) => {
            console.error('Error creating reel:', err.message);
            console.error('FFmpeg error details:', err); // Log error details
            // Clean up temporary image files even on error
            tempImageFiles.forEach(file => fs.unlinkSync(file));
            reject(err);
        })
        .on('stderr', (stderrLine) => {
            console.log('FFmpeg stderr:', stderrLine); // Log FFmpeg stderr output
        })
        .run();
    });
}

export { createReel };
