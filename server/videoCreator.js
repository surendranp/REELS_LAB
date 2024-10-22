import Jimp from 'jimp';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createReel(images, voiceOverPath, duration) {
    const outputFilePath = path.join(__dirname, '../output/reel.mp4');
    try {
        // Assume images is an array of URLs
        const imageFiles = await Promise.all(images.map(async (imageUrl, index) => {
            const image = await Jimp.read(imageUrl);
            const resizedImage = image.resize(1080, 720);
            const imagePath = path.join(__dirname, `../uploads/image${index + 1}.jpg`);
            await resizedImage.writeAsync(imagePath);
            return imagePath;
        }));

        const ffmpegCommand = `ffmpeg -t ${duration} -i ${imageFiles[0]} -i ${voiceOverPath} -y -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest -movflags +faststart ${outputFilePath}`;
        
        await executeCommand(ffmpegCommand);
        console.log(`Reel video successfully created: ${outputFilePath}`);
    } catch (error) {
        console.error("Error creating reel:", error);
    }
}

async function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}
