export async function resizeImageBlob(blob: Blob, newWidth: number, newHeight: number) : Promise<Blob> {
    // Create a URL from the blob
    const url = URL.createObjectURL(blob);

    // Load the image from the URL
    const img = new Image();
    img.src = url;

    // Wait for the image to load
    await new Promise(resolve => {
        img.onload = resolve;
    });

    // Create a canvas and get its context
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');

    // Draw the image onto the canvas with the new dimensions
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    // Convert the canvas back to a blob
    return new Promise(resolve => {
        canvas.toBlob(resolve);
    });
}
