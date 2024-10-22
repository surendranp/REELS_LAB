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
    } else {
        console.log('Output directory already exists:', outputDir);
    }

    const tempImageFiles = images.map((_, index) => {
        return path.join(__dirname, '../uploads', `image${index}.jpg`);
    });

    // Add user image at the beginning of the image array
    const allImages = [userImagePath, ...images];

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
            throw error;
        }
    }));

    console.log('User image path:', userImagePath);
    console.log('Voiceover path:', voiceOver);
    tempImageFiles.forEach((file, index) => {
        console.log(`Image file ${index}:`, file);
    });

    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        // Add the user-uploaded image first
        command.input(userImagePath).inputOptions([`-t ${duration / allImages.length}`]);

        // Add the related images next
        tempImageFiles.forEach((file) => {
            command.input(file).inputOptions([`-t ${duration / allImages.length}`]);
        });

        // Add the voiceover as an audio track
        if (fs.existsSync(voiceOver)) {
            command.input(voiceOver);
        } else {
            console.error('Voiceover file not found.');
            reject(new Error('Voiceover file not found.'));
        }

        command.outputOptions([
            '-r 30', // 30 FPS
            '-c:v libx264',
            '-c:a aac',
            '-pix_fmt yuv420p',
            '-shortest',
            '-movflags +faststart'
        ])
        .output(outputPath)
        .on('end', () => {
            console.log('Video successfully created:', outputPath);
            tempImageFiles.forEach(file => fs.unlinkSync(file));
            resolve(outputPath);
        })
        .on('error', (err) => {
            console.error('Error creating reel:', err.message);
            console.error('FFmpeg error details:', err); // Log error details
            tempImageFiles.forEach(file => fs.unlinkSync(file));
            reject(err);
        })
        .run();
    });
}

export { createReel };
