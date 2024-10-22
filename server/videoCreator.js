const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const ffmpegPath = require('ffmpeg-static');
const Jimp = require('jimp'); // Switch back to CommonJS import

ffmpeg.setFfmpegPath(ffmpegPath);

async function downloadImage(imageUrl, outputPath) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from ${imageUrl}, status: ${response.status}`);
        }
        const buffer = await response.buffer();
        fs.writeFileSync(outputPath, buffer);
        console.log(`Downloaded image: ${outputPath}`);
    } catch (error) {
        console.error(`Error downloading image from ${imageUrl}:`, error);
        throw error;
    }
}

async function resizeImageIfNeeded(imagePath) {
    const image = await Jimp.read(imagePath);
    const { width, height } = image.bitmap;

    if (width % 2 !== 0 || height % 2 !== 0) {
        const newWidth = width % 2 === 0 ? width : width + 1;
        const newHeight = height % 2 === 0 ? height : height + 1;
        await image.resize(newWidth, newHeight).writeAsync(imagePath);
        console.log(`Resized image to even dimensions: ${imagePath}`);
    }
}

async function createReel(images, voiceOverPath, duration) {
    const outputDir = path.join(__dirname, '../output');
    const outputPath = path.join(outputDir, 'reel.mp4');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('FFmpeg path:', ffmpegPath);

    const tempImageFiles = [];
    await Promise.all(images.slice(1).map(async (imageUrl, index) => {
        const outputFilePath = path.join(__dirname, '../uploads', `image${index}.jpg`);
        try {
            await downloadImage(imageUrl, outputFilePath);
            await resizeImageIfNeeded(outputFilePath);
            tempImageFiles.push(outputFilePath);
        } catch (error) {
            console.error(`Failed to download or process image ${imageUrl}:`, error);
        }
    }));

    if (!fs.existsSync(voiceOverPath)) {
        console.error('Voiceover file not found:', voiceOverPath);
        throw new Error('Voiceover file not found.');
    }

    const allFilesExist = [images[0], ...tempImageFiles].every(file => fs.existsSync(file));
    if (!allFilesExist) {
        throw new Error('One or more input files do not exist. Cannot proceed with FFmpeg.');
    }

    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        command.input(images[0]).inputOptions(`-t ${duration}`);
        tempImageFiles.forEach(file => {
            command.input(file).inputOptions(`-t ${duration}`);
        });

        command.input(voiceOverPath);

        command
            .outputOptions([
                '-c:v libx264',
                '-c:a aac',
                '-pix_fmt yuv420p',
                '-shortest',
                '-movflags +faststart',
            ])
            .output(outputPath)
            .on('start', (cmdline) => {
                console.log('FFmpeg command started:', cmdline);
            })
            .on('progress', (progress) => {
                console.log(`Processing: ${progress.percent}% done`);
            })
            .on('end', () => {
                console.log('Reel video successfully created:', outputPath);
                tempImageFiles.forEach(file => fs.unlinkSync(file));
                resolve(outputPath);
            })
            .on('error', (err, stdout, stderr) => {
                console.error('Error creating reel video:', err.message);
                console.error('FFmpeg stdout:', stdout);
                console.error('FFmpeg stderr:', stderr);
                tempImageFiles.forEach(file => fs.unlinkSync(file));
                reject(err);
            })
            .run();
    });
}

module.exports = { createReel };
