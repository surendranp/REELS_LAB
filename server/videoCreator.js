import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';  // Import ffmpeg-static

// Set the FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

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

    const downloadedImages = await Promise.all(
        relatedImages.map(async (imageUrl, index) => {
            const imageFilePath = path.join(imagesDir, `image${index}.jpg`);
            if (imageUrl.startsWith('http')) {
                console.log(`Downloading image: ${imageUrl}`);
                return await downloadImage(imageUrl, imageFilePath);
            } else {
                console.log(`Using local image: ${imageUrl}`);
                return imageUrl;  // Use local file path for user-uploaded image
            }
        })
    );

    downloadedImages.unshift(userImagePath);

    const outputReelPath = path.join(process.cwd(), 'output', 'reel.mp4');

    return new Promise((resolve, reject) => {
        const ffmpegCommand = ffmpeg();

        downloadedImages.forEach((imagePath) => {
            ffmpegCommand.input(imagePath).inputOptions([`-t ${duration / downloadedImages.length}`]);
        });

        ffmpegCommand.input(voiceOverPath);

        ffmpegCommand
            .outputOptions([
                '-y',
                '-r 30',
                '-c:v libx264',
                '-c:a aac',
                '-pix_fmt yuv420p',
                '-shortest',
                '-movflags +faststart'
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
