import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

export const createVideo = async (imageUrls) => {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(process.cwd(), 'uploads', 'output.mp4');

        ffmpeg()
            .input('image1.jpg') // Replace this with your logic to input images
            .input('image2.jpg') // Example for two images; you should loop through `imageUrls`
            .loop(30) // Loop for 30 seconds
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err))
            .run();
    });
};
