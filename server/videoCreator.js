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

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log('Output directory created:', outputDir);
    }

    const tempImageFiles = images.map((_, index) => {
        return path.join(__dirname, '../uploads', `image${index}.jpg`);
    });

    // Add user image at the beginning of the image array
    const allImages = [userImagePath, ...tempImageFiles];

    // Download related images to local filesystem
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

    // Check if the user-uploaded image exists
    if (!fs.existsSync(userImagePath)) {
        throw new Error(`User image file not found at ${userImagePath}`);
    }

    // Check if all downloaded images exist
    tempImageFiles.forEach((file, index) => {
        if (!fs.existsSync(file)) {
            throw new Error(`Downloaded image file ${index} not found at ${file}`);
        }
    });

    // Check if the voiceover file exists
    if (!fs.existsSync(voiceOver)) {
        throw new Error(`Voiceover file not found at ${voiceOver}`);
    }

    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        // Add the user-uploaded image first
        command.input(userImagePath).inputOptions([`-t ${duration / allImages.length}`]);

        // Add the related images next
        tempImageFiles.forEach((file) => {
            command.input(file).inputOptions([`-t ${duration / allImages.length}`]);
        });

        // Add the voiceover as an audio track
        command.input(voiceOver);

        command.outputOptions([
            '-r 30', // 30 FPS
            '-c:v libx264',
            '-c:a aac',
            '-pix_fmt yuv420p',
            '-shortest',
            '-movflags +faststart'
        ])
        .on('start', (commandLine) => {
            console.log('Spawned FFmpeg with command: ' + commandLine);
        })
        .on('stderr', (stderrLine) => {
            console.log('FFmpeg stderr: ' + stderrLine);
        })
        .on('end', () => {
            console.log('Video successfully created:', outputPath);
            tempImageFiles.forEach(file => fs.unlinkSync(file));
            resolve(outputPath);
        })
        .on('error', (err) => {
            console.error('Error creating reel:', err.message);
            tempImageFiles.forEach(file => fs.unlinkSync(file));
            reject(err);
        })
        .output(outputPath)
        .run();
    });
}

export { createReel };
