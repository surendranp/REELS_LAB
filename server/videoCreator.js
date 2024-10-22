import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

const downloadImage = async (url, dest) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download image from ${url}`);
    }
    const buffer = await response.buffer();
    fs.writeFileSync(dest, buffer);
    return dest;
};

export const createReel = async (relatedImages, userImagePath, voiceOverPath, duration) => {
    const imagesDir = path.join(process.cwd(), 'uploads');
    
    // Download related Unsplash images
    const downloadedImages = await Promise.all(
        relatedImages.map(async (imageUrl, index) => {
            const imageFilePath = path.join(imagesDir, `image${index}.jpg`);
            if (imageUrl.startsWith('http')) {  // Only fetch if it's a URL
                console.log(`Downloading image: ${imageUrl}`);
                return await downloadImage(imageUrl, imageFilePath);
            } else {
                // If it's a local file path (user uploaded image), return the path directly
                console.log(`Using local image: ${imageUrl}`);
                return imageUrl;
            }
        })
    );

    // Add the user-uploaded image to the beginning of the array
    downloadedImages.unshift(userImagePath);

    const outputReelPath = path.join(process.cwd(), 'output', 'reel.mp4');

    return new Promise((resolve, reject) => {
        const ffmpegCommand = ffmpeg()
            .input(downloadedImages[0]).inputOptions([`-t ${duration / downloadedImages.length}`])
            .input(downloadedImages[1]).inputOptions([`-t ${duration / downloadedImages.length}`])
            .input(downloadedImages[2]).inputOptions([`-t ${duration / downloadedImages.length}`])
            .input(voiceOverPath)
            .outputOptions([
                '-y', // Overwrite the output file if it exists
                '-r 30', // Set frame rate to 30 fps
                '-c:v libx264', // Video codec
                '-c:a aac', // Audio codec
                '-pix_fmt yuv420p', // Pixel format for video compatibility
                '-shortest', // Stop when the shortest input stream ends
                '-movflags +faststart' // Optimizes video for web streaming
            ])
            .output(outputReelPath)
            .on('end', () => {
                console.log('Reel video created:', outputReelPath);
                resolve(outputReelPath);
            })
            .on('error', (err) => {
                console.error('Error creating reel video:', err);
                reject(err);
            })
            .run();
    });
};
