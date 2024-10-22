import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import path from 'path';

const ffmpeg = createFFmpeg({ log: true });

export const createReel = async (relatedImages, userImagePath, voiceOverPath, duration) => {
    const outputPath = path.join(process.cwd(), 'output', 'reel.mp4');

    // Load FFmpeg core
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }

    // Log the input files
    console.log('Input files:');
    console.log(`User Image: ${userImagePath}`);
    console.log(`Voice Over: ${voiceOverPath}`);
    console.log('Related Images:', relatedImages);

    try {
        // Prepare files for FFmpeg
        ffmpeg.FS('writeFile', 'userImage.jpg', await fetchFile(userImagePath));
        ffmpeg.FS('writeFile', 'voiceover.mp3', await fetchFile(voiceOverPath));

        // Write related images to FFmpeg FS
        for (let i = 0; i < relatedImages.length; i++) {
            const imageUrl = relatedImages[i];
            const fileName = `image${i}.jpg`;
            ffmpeg.FS('writeFile', fileName, await fetchFile(imageUrl));
        }

        // Construct FFmpeg command
        const inputs = relatedImages.map((_, i) => `image${i}.jpg`).join(' ');

        await ffmpeg.run(
            '-framerate', '1/5', // 1 frame every 5 seconds
            '-i', `image%d.jpg`, // Input images
            '-i', 'userImage.jpg', // User image
            '-i', 'voiceover.mp3', // Voiceover
            '-c:v', 'libx264',
            '-t', duration, // Set the duration
            '-pix_fmt', 'yuv420p', // Ensure compatibility
            outputPath // Output file
        );

        // Read output
        await ffmpeg.FS('rename', 'output.mp4', path.basename(outputPath));

        console.log('Reel video created successfully!');
        return outputPath;
    } catch (error) {
        console.error('Error creating reel video:', error);
        throw new Error(`Error creating reel video: ${error.message}`);
    } finally {
        // Clean up the FS
        ffmpeg.FS('unlink', 'userImage.jpg');
        ffmpeg.FS('unlink', 'voiceover.mp3');
        relatedImages.forEach((_, i) => ffmpeg.FS('unlink', `image${i}.jpg`));
    }
};
