document.getElementById('videoForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission

    const formData = new FormData(e.target);

    try {
        const response = await fetch('/create-reel', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to create video');
        }

        const { videoPath } = await response.json(); // Assuming your server responds with the video path

        // Show the download link
        const downloadContainer = document.getElementById('downloadContainer');
        const downloadLink = document.getElementById('downloadLink');

        downloadLink.href = videoPath; // Set the href to the video file path
        downloadContainer.style.display = 'block'; // Show the download container
    } catch (error) {
        console.error('Error:', error);
    } 
});
