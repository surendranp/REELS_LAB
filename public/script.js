document.getElementById('reelForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    try {
        const response = await fetch('/create-reel', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        displayRelatedImages(data.relatedImages);
    } catch (error) {
        console.error('Error creating reel:', error);
    }
});

function displayRelatedImages(images) {
    const relatedImagesDiv = document.getElementById('relatedImages');
    relatedImagesDiv.innerHTML = ''; // Clear previous images

    images.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Related Image';
        img.style.width = '200px'; // Adjust size as needed
        img.style.margin = '10px';
        relatedImagesDiv.appendChild(img);
    });
}
