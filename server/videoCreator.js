import ffmpeg from 'fluent-ffmpeg'; // Use fluent-ffmpeg
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import ffmpegPath from 'ffmpeg-static'; // Use ffmpeg-static for the FFmpeg path

ffmpeg.setFfmpegPath(ffmpegPath); // Set the path to FFmpeg

// Function to create a reel from images and voiceover
async function createReel(images, voiceOver, duration) {
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

        command.outputOptions([
            '-r 30', // Set frame rate to 30 FPS
            '-c:v libx264', // Codec for video
            '-c:a aac', // Codec for audio
            '-pix_fmt yuv420p', // Set pixel format
            '-shortest' // Stop when the shortest input ends
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
