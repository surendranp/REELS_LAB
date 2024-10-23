import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import ffmpegPath from 'ffmpeg-static';
import { fileURLToPath } from 'url';
import sharp from 'sharp'; // Import sharp for image validation

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegPath);

async function createReel(images, userImagePath, voiceOver, duration) {
    const outputDir = path.join(__dirname, '../output');
    const outputPath = path.join(outputDir, 'reel.mp4');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log('Output directory created:', outputDir);
    }

    const tempImageFiles = images.map((_, index) => path.join(__dirname, '../uploads', `image${index}.jpg`));
    const allImages = [userImagePath, ...tempImageFiles];

    if (!fs.existsSync(userImagePath)) {
        console.error(`User image not found: ${userImagePath}`);
        throw new Error('User image not found.');
    }

    await Promise.all(images.map(async (imageUrl, index) => {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.statusText}`);
            }
            const buffer = await response.buffer();
            fs.writeFileSync(tempImageFiles[index], buffer);
            console.log(`Downloaded image ${index}:`, tempImageFiles[index]);
            
            // Check image validity
            const imageMetadata = await sharp(tempImageFiles[index]).metadata();
            console.log(`Image ${index} metadata:`, imageMetadata);
        } catch (error) {
            console.error(`Error downloading image ${index}:`, error);
            throw error;
        }
    }));

    tempImageFiles.forEach((file, index) => {
        if (!fs.existsSync(file)) {
            console.error(`Downloaded image not found: ${file}`);
            throw new Error(`Downloaded image not found: ${file}`);
        } else {
            console.log(`Image file ${index} exists: ${file}, Size: ${fs.statSync(file).size} bytes`);
        }
    });

    if (!fs.existsSync(voiceOver)) {
        console.error('Voiceover file not found.');
        throw new Error('Voiceover file not found.');
    } else {
        console.log('Voiceover path:', voiceOver, `Size: ${fs.statSync(voiceOver).size} bytes`);
    }

    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        command.input(userImagePath)
               .inputOptions(['-loop 1', `-t ${duration / (tempImageFiles.length + 1)}`]) // Loop the user image
               .videoFilter('scale=trunc(iw/2)*2:trunc(ih/2)*2');

        tempImageFiles.forEach((file) => {
            command.input(file)
                   .inputOptions(['-loop 1', `-t ${duration / (tempImageFiles.length + 1)}`]); // Loop each image
        });

        command.input(voiceOver)
               .outputOptions([
                   '-r 30',
                   '-c:v libx264',
                   '-c:a aac',
                   '-strict experimental',
                   '-pix_fmt yuv420p',
                   '-shortest',
                   '-movflags +faststart',
                   '-loglevel debug' // Use debug level for detailed logs
               ])
               .output(outputPath)
               .on('start', (commandLine) => {
                   console.log('FFmpeg command: ', commandLine);
               })
               .on('stderr', (stderrLine) => {
                   console.error('FFmpeg stderr:', stderrLine);
               })
               .on('end', () => {
                   console.log('Video successfully created:', outputPath);
                   tempImageFiles.forEach(file => fs.unlinkSync(file));
                   resolve(outputPath);
               })
               .on('error', (err) => {
                   console.error('Error creating reel:', err.message);
                   reject(err);
               })
               .run();
    });
}

export { createReel };
