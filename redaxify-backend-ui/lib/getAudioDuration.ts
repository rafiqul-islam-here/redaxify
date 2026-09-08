export const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
        const audio = document.createElement("audio");
        audio.preload = "metadata";
        audio.onloadedmetadata = () => {
            window.URL.revokeObjectURL(audio.src);
            resolve(audio.duration);
        };
        audio.onerror = () => {
            console.error("Failed to extract duration");
            resolve(0);
        };
        audio.src = URL.createObjectURL(file);
    });
};