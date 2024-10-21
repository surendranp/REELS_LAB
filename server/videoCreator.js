const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

// Function to create a reel from images and voiceover
async function createReel(images, voiceOver, duration) {
    const outputPath = path.join(__dirname, '../output', 'reel.mp4'); // Path to the output video
    const tempImageFiles = images.map((image, index) => {
        return path.join(__dirname, '../uploads', `image${index}.jpg`); // Temporary image file path
    });

    // Download images to local filesystem
    await Promise.all(images.map(async (imageUrl, index) => {
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        fs.writeFileSync(tempImageFiles[index], buffer);
    }));

    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        // Add images to ffmpeg input
        tempImageFiles.forEach((file) => {
            command.input(file).inputOptions(['-t 3']); // Show each image for 3 seconds (adjust as needed)
        });

        // Add the voiceover as an audio track
        command.input(voiceOver)
            .outputOptions([
                '-r 30', // Set framerate to 30 FPS
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

module.exports = { createReel };
