"use client";
import React, { useRef, useState, useCallback } from "react";

type OCRMatchedWord = {
    text: string;
    boundingBox: number[];
    page: number;
};

type OCRResult = {
    success: boolean;
    message?: string;
    error?: string;
    data?: {
        dbId: number;
        matchedWords?: OCRMatchedWord[];
        fullText?: string;
    };
    details?: string;
};

type ImageViewerProps = {
    documentUrl: string;
    documentName: string;
    documentId: number;
    signedUrl: string;
};

type HighlightMode = "highlight" | "blur" | "extract";

const CANVAS_HEIGHT = 400; // fixed height for canvas
const CANVAS_WIDTH = 800;  // fixed width for canvas

const ImageViewer: React.FC<ImageViewerProps> = ({ documentName, documentId, signedUrl }) => {
    const [ocrInput, setOcrInput] = useState<string>("");
    const [ocrProcessing, setOcrProcessing] = useState(false);
    const [ocrError, setOcrError] = useState<string | null>(null);
    const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [highlightMode, setHighlightMode] = useState<HighlightMode>("highlight");
    const [showOcrResult, setShowOcrResult] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const [textCopied, setTextCopied] = useState(false);


    const handleHighlightModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setHighlightMode(e.target.value as HighlightMode);
        setShowOcrResult(false); // <-- HIDE result block on select change
    };

    // Enhanced blur function
    const applyBlur = (ctx: CanvasRenderingContext2D, imageData: ImageData, radius: number = 5): ImageData => {
        const { data, width, height } = imageData;
        const output = new ImageData(width, height);
        const outputData = output.data;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0, count = 0;

                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const idx = (ny * width + nx) * 4;
                            r += data[idx];
                            g += data[idx + 1];
                            b += data[idx + 2];
                            a += data[idx + 3];
                            count++;
                        }
                    }
                }

                const idx = (y * width + x) * 4;
                outputData[idx] = r / count;
                outputData[idx + 1] = g / count;
                outputData[idx + 2] = b / count;
                outputData[idx + 3] = a / count;
            }
        }

        return output;
    };

    // Draw polygon path
    const drawPolygonPath = (ctx: CanvasRenderingContext2D, points: number[]) => {
        if (points.length < 8) return;

        ctx.beginPath();
        ctx.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
            ctx.lineTo(points[i], points[i + 1]);
        }
        ctx.closePath();
    };

    const drawEffects = useCallback(() => {
        if (!canvasRef.current || !imageRef.current || !ocrResult || !imageLoaded) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const image = imageRef.current;

        if (!ctx) return;

        // Set canvas size to fixed dimensions
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        canvas.style.width = `${CANVAS_WIDTH}px`;
        canvas.style.height = `${CANVAS_HEIGHT}px`;

        // Clear and redraw image scaled to fit canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw image scaled to canvas size
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Only draw effects in highlight/blur mode
        if (highlightMode === "extract") return;

        const matched = ocrResult.data?.matchedWords || [];

        matched.forEach((word: OCRMatchedWord) => {
            const pts = word.boundingBox;
            if (pts.length === 8) {
                // Scale bounding box points to canvas size if image was scaled
                const scaleX = CANVAS_WIDTH / image.naturalWidth;
                const scaleY = CANVAS_HEIGHT / image.naturalHeight;
                const scaledPts = pts.map((v, idx) => idx % 2 === 0 ? v * scaleX : v * scaleY);

                if (highlightMode === "highlight") {
                    // Highlight mode
                    ctx.save();

                    // Draw highlight background
                    ctx.globalAlpha = 0.4;
                    drawPolygonPath(ctx, scaledPts);
                    ctx.fillStyle = '#FFD700';
                    ctx.fill();

                    // Draw border
                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = '#FF0000';
                    //ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.restore();

                } else if (highlightMode === "blur") {
                    // Advanced blur mode
                    ctx.save();

                    // Create clipping path
                    drawPolygonPath(ctx, scaledPts);
                    ctx.clip();

                    // Get the region bounds
                    const minX = Math.min(scaledPts[0], scaledPts[2], scaledPts[4], scaledPts[6]);
                    const maxX = Math.max(scaledPts[0], scaledPts[2], scaledPts[4], scaledPts[6]);
                    const minY = Math.min(scaledPts[1], scaledPts[3], scaledPts[5], scaledPts[7]);
                    const maxY = Math.max(scaledPts[1], scaledPts[3], scaledPts[5], scaledPts[7]);

                    const regionWidth = maxX - minX;
                    const regionHeight = maxY - minY;

                    if (regionWidth > 0 && regionHeight > 0) {
                        // Get image data for the region
                        const imageData = ctx.getImageData(minX, minY, regionWidth, regionHeight);

                        // Apply multiple blur passes for stronger effect
                        let blurredData = applyBlur(ctx, imageData, 3);
                        blurredData = applyBlur(ctx, blurredData, 3);
                        blurredData = applyBlur(ctx, blurredData, 2);

                        // Draw the blurred region back
                        ctx.putImageData(blurredData, minX, minY);

                        // Add subtle border
                        ctx.restore();
                        ctx.save();
                        drawPolygonPath(ctx, scaledPts);
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }

                    ctx.restore();
                }
            }
        });
    }, [ocrResult, highlightMode, imageLoaded]);

    // OCR API call
    async function handleOcrProcessText() {
        if (!signedUrl) return;
        if (highlightMode !== "extract" && !ocrInput) return;
        setOcrProcessing(true);
        setOcrError(null);
        setOcrResult(null);
        setShowOcrResult(false); // <-- hide result block at start of process

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/ocr/vision`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documentId,
                    imageUrl: signedUrl,
                    textToBlur: highlightMode === "extract" ? undefined : ocrInput,
                    mode: highlightMode,
                }),
            });

            const data: OCRResult = await res.json();
            setOcrProcessing(false);

            if (!res.ok || !data.success) {
                setOcrError(data.error || data.details || "OCR failed");
                setShowOcrResult(true); // show result block (with error)
                return;
            }
            setOcrResult(data);
            setShowOcrResult(true); // show result block after API response
        } catch (err: any) {
            setOcrError(err?.message || "OCR API request failed.");
            setOcrProcessing(false);
            setShowOcrResult(true); // show result block (with error)
        }
    }

    // Handle image load
    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    // Re-draw effects when OCR result or mode changes
    React.useEffect(() => {
        drawEffects();
    }, [drawEffects]);

    const downloadImage = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const dataURL = canvas.toDataURL('image/png', 1.0);

        const link = document.createElement('a');
        link.download = `${documentName}_processed.png`;
        link.href = dataURL;
        link.click();
    };

    const resetCanvas = () => {
        setOcrResult(null);
        setShowOcrResult(false); // <-- hide result block on reset
        if (canvasRef.current && imageRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const image = imageRef.current;

            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            }
        }
    };

    function renderOcrResult() {
        if (!showOcrResult) return null;
        if (!ocrResult) {
            return ocrError ? <div className="text-red-400 text-xs mt-2">{ocrError}</div> : null;
        }
        if (!ocrResult.success) {
            return <div className="text-red-400 text-xs mt-2">{ocrResult.error || ocrResult.details}</div>;
        }
        const matched = ocrResult.data?.matchedWords || [];
        const fullText = ocrResult.data?.fullText || "";

        if (highlightMode === "extract") {
            return (
                <div className="mt-4 p-4 bg-[#191936] rounded-lg text-white shadow-md" style={{ maxWidth: 600 }}>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">OCR Extracted Text</h3>
                        {fullText && (
                            <button
                                className={`px-2 py-1 bg-green-700 rounded text-xs hover:bg-green-800 ${textCopied ? "opacity-70" : ""}`}
                                onClick={() => {
                                    navigator.clipboard.writeText(fullText);
                                    setTextCopied(true);
                                    setTimeout(() => setTextCopied(false), 1000);
                                }}
                            >
                                {textCopied ? "Copied!" : "Copy"}
                            </button>
                        )}
                    </div>
                    {fullText ? (
                        <pre className="text-sm text-yellow-200 whitespace-pre-wrap">{fullText}</pre>
                    ) : (
                        <div className="text-yellow-400">No text found.</div>
                    )}
                </div>
            );
        }

        return (
            <div className="mt-4 p-4 bg-[#191936] rounded-lg text-white shadow-md" style={{ maxWidth: 600 }}>
                <h3 className="text-lg font-semibold mb-2">
                    OCR Results ({highlightMode === "highlight" ? "Highlight" : "Blur"} Text)
                </h3>
                {matched.length === 0 ? (
                    <div className="text-yellow-400">No matching text found.</div>
                ) : (
                    <ul className="list-disc list-inside text-sm">
                        {matched.map((word: OCRMatchedWord, idx: number) => (
                            <li key={idx}>
                                <strong>Text:</strong> {word.text}{" "}
                                <strong>Bounding Box:</strong> [{word.boundingBox?.join(", ")}]{" "}
                                <strong>Page:</strong> {word.page}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }


    return (
        <div className="w-full flex flex-col items-center">
            <div className="flex flex-col gap-2 mb-4 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                    <input
                        type="text"
                        value={ocrInput}
                        onChange={(e) => setOcrInput(e.target.value)}
                        placeholder="Enter text to detect (OCR)..."
                        className="px-3 py-2 rounded border border-gray-500 text-sm text-white bg-[#191936] flex-1 min-w-[200px]"
                        disabled={ocrProcessing || highlightMode === "extract"}
                        style={{ backgroundColor: highlightMode === "extract" ? "#222244" : "#191936" }}
                    />
                    <select
                        value={highlightMode}
                        onChange={handleHighlightModeChange}
                        className="px-3 py-2 rounded border border-gray-500 text-sm text-white bg-[#191936]"
                        disabled={ocrProcessing}
                    >
                        <option value="highlight">Highlight</option>
                        <option value="blur">Blur</option>
                        <option value="extract">Extract All Text</option>
                    </select>
                    <button
                        className={`px-4 py-2 bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] text-white rounded-full text-sm flex items-center gap-2 ${ocrProcessing || !signedUrl || (highlightMode !== "extract" && !ocrInput) ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                        onClick={handleOcrProcessText}
                        disabled={ocrProcessing || !signedUrl || (highlightMode !== "extract" && !ocrInput)}
                    >
                        {ocrProcessing ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z" />
                                </svg>
                                Processing...
                            </>
                        ) : (
                            "Process"
                        )}
                    </button>

                    <button
                        className="px-4 py-2 bg-gradient-to-r from-[#335FFF] to-[#1A4BFF] text-white rounded-full text-sm hover:from-[#2d4de6] hover:to-[#173fcc]"
                        onClick={downloadImage}
                        disabled={!imageLoaded}
                    >
                        Download
                    </button>

                    <button
                        className="px-4 py-2 bg-gradient-to-r from-[#5A7FFF] to-[#3B6BFF] text-white rounded-full text-sm hover:from-[#4e6fe6] hover:to-[#345ce6]"
                        onClick={resetCanvas}
                        disabled={!imageLoaded}
                    >
                        Reset
                    </button>

                </div>
                {/* Only show error if not showing result block */}
                {ocrError && !showOcrResult && <div className="text-red-400 text-xs mt-2">{ocrError}</div>}
            </div>

            <div className="relative border border-gray-300 rounded-lg overflow-hidden shadow-lg flex flex-row justify-center" style={{ minHeight: CANVAS_HEIGHT, minWidth: CANVAS_WIDTH }}>
                <img
                    ref={imageRef}
                    src={signedUrl}
                    alt={documentName}
                    crossOrigin="anonymous"
                    onLoad={handleImageLoad}
                    style={{
                        display: imageLoaded ? 'block' : 'none',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: `${CANVAS_WIDTH}px`,
                        height: `${CANVAS_HEIGHT}px`,
                        objectFit: "contain",
                        zIndex: 1
                    }}
                />
                <canvas
                    ref={canvasRef}
                    style={{
                        display: imageLoaded ? 'block' : 'none',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: `${CANVAS_WIDTH}px`,
                        height: `${CANVAS_HEIGHT}px`,
                        pointerEvents: 'none',
                        zIndex: 2
                    }}
                />
                {!imageLoaded && (
                    <div className="flex items-center justify-center bg-gray-100"
                        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
                        <div className="text-gray-500">Loading image...</div>
                    </div>
                )}
            </div>

            {/* Result is outside the canvas/image area */}
            {renderOcrResult()}
        </div>
    );
};

export default ImageViewer;