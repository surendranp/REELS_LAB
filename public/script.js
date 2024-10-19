document.getElementById('reel-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const response = await fetch('/generate-reel', {
        method: 'POST',
        body: formData,
    });

    const result = document.getElementById('result');
    if (response.ok) {
        const data = await response.json();
        // Display video and download link
        result.innerHTML = `
            <p>${data.message}</p>
            <video controls src="${data.reel}" style="max-width: 100%; height: auto;"></video>
            <br>
            <a href="${data.reel}" download="reel.mp4" class="download-button">Download Video</a>
        `;
    } else {
        const error = await response.json();
        result.innerHTML = `<p>Error: ${error.message}</p>`;
    }
});
