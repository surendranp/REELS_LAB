const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

// Create an FFmpeg instance
const ffmpeg = createFFmpeg({ log: true });

// Function to create a reel from images and voiceover
async function createReel(images, voiceOver, duration) {
    const outputPath = path.join(__dirname, '../output', 'reel.mp4'); // Path to the output video
    const tempImageFiles = images.map((_, index) => {
        return path.join(__dirname, '../uploads', `image${index}.jpg`); // Temporary image file path
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

    // Load FFmpeg
    await ffmpeg.load();

    // Write image files to FFmpeg's virtual filesystem
    for (const [index, file] of tempImageFiles.entries()) {
        ffmpeg.FS('writeFile', `image${index}.jpg`, await fetchFile(file));
    }

    // Write the voiceover file into FFmpeg's virtual filesystem
    ffmpeg.FS('writeFile', 'voiceover.mp3', await fetchFile(voiceOver));

    // Run the FFmpeg command
    await ffmpeg.run(
        '-framerate', '1',
        '-i', 'image%d.jpg',
        '-i', 'voiceover.mp3',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        'reel.mp4' // Output filename in the virtual filesystem
    );

    // Read the result
    const data = ffmpeg.FS('readFile', 'reel.mp4');

    // Write the result to the filesystem
    fs.writeFileSync(outputPath, Buffer.from(data));

    // Cleanup temporary image files
    tempImageFiles.forEach(file => fs.unlinkSync(file));

    console.log('Video successfully created:', outputPath);
    return outputPath;
}

module.exports = { createReel };
