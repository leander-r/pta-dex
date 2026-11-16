// ============================================================
// IMAGE UTILITIES
// ============================================================
// Shared avatar-resize helper — keeps uploaded images small before they're
// stored as a base64 data URL in localStorage/trainer JSON. Without this,
// an uploaded image is stored at its original size; a single large photo
// can blow past localStorage's quota and break saving entirely, not just
// for that one avatar.

/**
 * Reads an image file and returns a resized, JPEG-compressed data URL.
 * @param {File} file
 * @param {number} maxSize - max width/height in px, aspect ratio preserved
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<string>} data URL
 */
export const resizeImageFile = (file, maxSize = 150, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = (event) => {
            const img = new Image();
            img.onerror = () => reject(new Error('Could not load image'));
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                if (width > height) {
                    if (width > maxSize) { height *= maxSize / width; width = maxSize; }
                } else {
                    if (height > maxSize) { width *= maxSize / height; height = maxSize; }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
};
