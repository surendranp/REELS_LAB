document.getElementById('reel-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const result = document.getElementById('result');
    const statusMessages = document.getElementById('status-messages');
    const loader = document.getElementById('loader');

    // Clear previous messages and results
    statusMessages.innerHTML = '';
    result.innerHTML = '';

    // Show loader
    loader.style.display = 'block';

    try {
        // Step 1: Upload Image and generate the reel
        const response = await fetch('/generate-reel', {
            method: 'POST',
            body: formData,
        });

        // Hide loader when response is received
        loader.style.display = 'none';

        // Check for success response
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate reel.');
        }

        const data = await response.json();

        // Update status messages for each successful step
        statusMessages.innerHTML += `<p>Image uploaded successfully (✓)</p>`;
        statusMessages.innerHTML += `<p>Text added successfully (✓)</p>`;
        statusMessages.innerHTML += `<p>Duration set successfully (✓)</p>`;
        statusMessages.innerHTML += `<p>Voice generated successfully (✓)</p>`;
        statusMessages.innerHTML += `<p>Video reel created successfully (✓)</p>`;

        // Display video and download link
        result.innerHTML = `
            <p>${data.message}</p>
            <video controls src="${data.reelUrl}" style="max-width: 100%; height: auto;"></video>
            <br>
            <a href="${data.reelUrl}" download="reel.mp4" class="download-button">Download Video</a>
        `;
    } catch (error) {
        loader.style.display = 'none'; // Hide loader if there's an error
        statusMessages.innerHTML += `<p style="color: red;">Error: ${error.message}</p>`;
    }
});
