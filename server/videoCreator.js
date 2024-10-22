import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

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
    const outputDir = path.join(process.cwd(), 'output');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const downloadedImages = await Promise.all(
        relatedImages.map(async (imageUrl, index) => {
            const imageFilePath = path.join(imagesDir, `image${index}.jpg`);
            if (imageUrl.startsWith('http')) {
                console.log(`Downloading image: ${imageUrl}`);
                return await downloadImage(imageUrl, imageFilePath);
            } else {
                console.log(`Using local image: ${imageUrl}`);
                return imageUrl;
            }
        })
    );

    downloadedImages.unshift(userImagePath);

    const outputReelPath = path.join(outputDir, 'reel.mp4');
    const durationPerImage = Math.max(1, duration / downloadedImages.length); // Ensure at least 1 second

    return new Promise((resolve, reject) => {
        const ffmpegCommand = ffmpeg();

        downloadedImages.forEach((imagePath) => {
            console.log(`Adding image to FFmpeg command: ${imagePath}`);
            ffmpegCommand.input(imagePath).inputOptions([`-t ${durationPerImage}`]);
        });

        ffmpegCommand.input(voiceOverPath);
        console.log(`Voiceover path: ${voiceOverPath}`);

        ffmpegCommand
            .outputOptions([
                '-y',
                '-loglevel debug',  // Increased log level for more details
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
