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
        ffmpeg()
            .input(`concat:${tempImageFiles.join('|')}`) // Concatenate images for video
            .input(voiceOver) // Input audio file
            .outputOptions([
                `-r 1`, // Frame rate of 1 fps
                `-t ${duration}`, // Duration of the video
                '-c:v libx264', // Codec for video
                '-c:a aac', // Codec for audio
                '-strict experimental', // Allow experimental features
                '-shortest' // Stop when the shortest input ends
            ])
            .output(outputPath)
            .on('end', () => {
                // Cleanup temporary files
                tempImageFiles.forEach(file => fs.unlinkSync(file));
                resolve(outputPath);
            })
            .on('error', (err) => {
                // Cleanup temporary files on error
                tempImageFiles.forEach(file => fs.unlinkSync(file));
                reject(err);
            })
            .run();
    });
}

module.exports = { createReel };
