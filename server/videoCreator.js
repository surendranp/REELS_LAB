const { exec } = require('child_process');
const path = require('path');

async function createReel(images, voiceOver, duration) {
    const outputPath = path.join(__dirname, '../output/output.mp4');
    const command = `ffmpeg -framerate 1 -i ${images.join(' -i ')} -i ${voiceOver} -c:v libx264 -t ${duration} -pix_fmt yuv420p ${outputPath}`;
    
    return new Promise((resolve, reject) => {
        exec(command, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve(outputPath);
            }
        });
    });
}

module.exports = { createReel };
