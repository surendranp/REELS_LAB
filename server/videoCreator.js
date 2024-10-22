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

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log('Output directory created:', outputDir);
    }

    // Validate input files
    const tempImageFiles = images.map((_, index) => path.join(__dirname, '../uploads', `image${index}.jpg`));
    const allImages = [userImagePath, ...tempImageFiles];

    // Check if user image exists
    if (!fs.existsSync(userImagePath)) {
        console.error(`User image not found: ${userImagePath}`);
        throw new Error('User image not found.');
    }

    // Download images
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
            throw error;
        }
    }));

    // Check downloaded images and voiceover
    tempImageFiles.forEach((file, index) => {
        if (!fs.existsSync(file)) {
            console.error(`Downloaded image not found: ${file}`);
        } else {
            console.log(`Image file ${index} exists: ${file}, Size: ${fs.statSync(file).size} bytes`);
        }
    });

    // Check voiceover
    if (!fs.existsSync(voiceOver)) {
        console.error('Voiceover file not found.');
        throw new Error('Voiceover file not found.');
    } else {
        console.log('Voiceover path:', voiceOver, `Size: ${fs.statSync(voiceOver).size} bytes`);
    }

    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        // Use the user image and add all temporary images
        command.input(userImagePath).inputOptions([`-t ${duration / (tempImageFiles.length + 1)}`]);

        tempImageFiles.forEach((file) => {
            command.input(file).inputOptions([`-t ${duration / (tempImageFiles.length + 1)}`]);
        });

        command.input(voiceOver);

        console.log('FFmpeg command:', command);

        command.outputOptions([
            '-r 30', // 30 FPS
            '-c:v libx264',
            '-c:a aac',
            '-pix_fmt yuv420p',
            '-movflags +faststart',
            '-loglevel debug' // Enable verbose logging
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
            reject(err);
        })
        .on('stderr', (stderrLine) => {
            console.log('FFmpeg stderr:', stderrLine);
        })
        .run();
    });
}

export { createReel };
