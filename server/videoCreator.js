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

    // Check downloaded images
    tempImageFiles.forEach((file, index) => {
        if (!fs.existsSync(file)) {
            console.error(`Downloaded image not found: ${file}`);
            throw new Error(`Downloaded image not found: ${file}`);
        } else {
            console.log(`Image file ${index} exists: ${file}, Size: ${fs.statSync(file).size} bytes`);
        }
    });

    // Check voiceover file
    if (!fs.existsSync(voiceOver)) {
        console.error('Voiceover file not found.');
        throw new Error('Voiceover file not found.');
    } else {
        console.log('Voiceover path:', voiceOver, `Size: ${fs.statSync(voiceOver).size} bytes`);
    }

    // FFmpeg video creation process
    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        // Add user image with scaling filter to ensure dimensions are divisible by 2
        command.input(userImagePath).inputOptions([`-t ${duration / (tempImageFiles.length + 1)}`])
               .videoFilter('scale=trunc(iw/2)*2:trunc(ih/2)*2'); // Ensure even width and height

        // Add downloaded images with the same scaling filter
        tempImageFiles.forEach((file) => {
            command.input(file).inputOptions([`-t ${duration / (tempImageFiles.length + 1)}`])
                   .videoFilter('scale=trunc(iw/2)*2:trunc(ih/2)*2'); // Ensure even width and height
        });

        // Add voiceover
        command.input(voiceOver);

        console.log('FFmpeg command initialized.');

        command.outputOptions([
            '-r 30', // 30 FPS
            '-c:v libx264', // Use H.264 codec for video
            '-c:a aac', // Use AAC codec for audio
            '-strict experimental', // Use experimental AAC codec
            '-pix_fmt yuv420p', // Ensure compatibility with most players
            '-shortest', // Stop video when audio ends
            '-movflags +faststart', // Optimize for web streaming
            '-loglevel verbose' // Increase verbosity for troubleshooting
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
            console.log('FFmpeg command: ', commandLine);
        })
        .on('stderr', (stderrLine) => {
            console.error('FFmpeg stderr:', stderrLine);  // Log detailed FFmpeg errors
        })
        .on('end', () => {
            console.log('Video successfully created:', outputPath);
            // Clean up temporary image files after creating the video
            tempImageFiles.forEach(file => fs.unlinkSync(file));
            resolve(outputPath);
        })
        .on('error', (err) => {
            console.error('Error creating reel:', err.message);
            reject(err);
        })
        .run();
    });
}

export { createReel };
