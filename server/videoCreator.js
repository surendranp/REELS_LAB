const ffmpeg = require('fluent-ffmpeg');
const fetch = require('node-fetch');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Function to create a video from images
async function createVideo(images, duration) {
    const tempImageFiles = [];

    // Download and resize images
    await Promise.all(images.map(async (imageUrl, index) => {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.statusText}`);
            }
            const buffer = await response.buffer();
            const tempFilePath = path.join(__dirname, `temp_image_${index}.jpg`);

            // Resize the image before saving
            await sharp(buffer)
                .resize({ width: 1280 }) // Resize to a maximum width of 1280px
                .toFile(tempFilePath);
            
            console.log(`Downloaded and resized image ${index}:`, tempFilePath);
            tempImageFiles.push(tempFilePath);
        } catch (error) {
            console.error(`Error downloading or processing image ${index}:`, error);
            throw error;
        }
    }));

    // Adjust duration for each image
    const adjustedDuration = duration / (tempImageFiles.length); // Adjusted duration for each image

    // Create video using FFmpeg
    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        // Add images to FFmpeg command
        tempImageFiles.forEach((file) => {
            command.input(file)
                .inputOptions(['-loop 1', `-t ${adjustedDuration}`]); // Loop each image for adjusted duration
        });

        // Set output options
        command
            .outputOptions('-c:v libx264') // Video codec
            .outputOptions('-pix_fmt yuv420p') // Pixel format
            .output('output_video.mp4') // Output video file
            .on('end', () => {
                console.log('Video created successfully.');
                // Cleanup temp files
                tempImageFiles.forEach((file) => fs.unlinkSync(file));
                resolve('output_video.mp4');
            })
            .on('error', (err) => {
                console.error('Error creating video:', err);
                // Cleanup temp files
                tempImageFiles.forEach((file) => fs.unlinkSync(file));
                reject(err);
            })
            .run();
    });
}

// Export the function using CommonJS syntax
module.exports = createVideo;
