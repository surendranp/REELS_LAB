import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

export const createReel = (relatedImages, userImagePath, voiceOverPath, duration) => {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(process.cwd(), 'output', 'reel.mp4');

        // Create the FFmpeg command
        const command = ffmpeg();

        // Log the input files
        console.log('Input files:');
        console.log(`User Image: ${userImagePath}`);
        console.log(`Voice Over: ${voiceOverPath}`);
        console.log('Related Images:', relatedImages);

        // Add images to the command
        relatedImages.forEach(image => {
            command.input(image);
        });

        command.input(userImagePath)
            .input(voiceOverPath)
            .outputOptions([
                `-t ${duration}`, // Set the duration
                '-pix_fmt yuv420p', // Ensure compatibility
                '-c:v libx264', // Set video codec
                '-vf "fps=25,format=yuv420p"' // Set frame rate and format
            ])
            .on('start', (commandLine) => {
                console.log('FFmpeg command: ', commandLine);
            })
            .on('end', () => {
                console.log('Reel video created successfully!');
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('Error creating reel video:', err);
                reject(new Error(`FFmpeg exited with code ${err.code}: ${err.message}`));
            })
            .save(outputPath);
    });
};
