import React, { useState, useCallback, useEffect } from 'react';
import { AnalysisResult } from '../types';
import { analyzeText, analyzeImage, analyzeVideo } from '../services/geminiService';
import ResultDisplay from './ResultDisplay';
import Spinner from './Spinner';

type Tab = 'text' | 'image' | 'video';

const extractFrames = (videoFile: File, frameCount: number): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true; // Important for autoplay programmatically
        video.playsInline = true; // Important for iOS

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const frames: string[] = [];

        video.src = URL.createObjectURL(videoFile);

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const duration = video.duration;
            // Ensure at least one frame is captured for very short videos
            const interval = duration > 0 ? duration / frameCount : 0;
            let currentTime = 0;
            let framesExtracted = 0;

            video.onseeked = () => {
                if (!context) {
                    return reject(new Error("Could not get canvas context."));
                }
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                frames.push(canvas.toDataURL('image/jpeg'));
                framesExtracted++;

                if (framesExtracted >= frameCount) {
                    URL.revokeObjectURL(video.src);
                    resolve(frames);
                } else {
                    currentTime += interval;
                    if (currentTime <= duration) {
                        video.currentTime = currentTime;
                    } else { // Handle case where interval calculation is off
                        URL.revokeObjectURL(video.src);
                        resolve(frames);
                    }
                }
            };
            
            video.onerror = (e) => {
                 URL.revokeObjectURL(video.src);
                 reject(new Error("Error loading video file for frame extraction."));
            };

            // Start seeking to the first frame
            video.currentTime = 0.01; // Seeking to 0 can be unreliable
        };
        
        // Kick off loading the video
        video.load();
    });
};


const Detector: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('text');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [statusText, setStatusText] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const [inputText, setInputText] = useState<string>('');
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);

    useEffect(() => {
        // Cleanup object URLs to prevent memory leaks
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            if (videoPreview) URL.revokeObjectURL(videoPreview);
        };
    }, [imagePreview, videoPreview]);

    const handleImageFileChange = (selectedFile: File | null) => {
        if (selectedFile) {
            if (!selectedFile.type.startsWith('image/')) {
                setError('Only image files are supported for analysis.');
                return;
            }
            setError(null);
            setResult(null);
            setImageFile(selectedFile);

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setImageBase64(base64String);
            };
            reader.readAsDataURL(selectedFile);

            if (imagePreview) URL.revokeObjectURL(imagePreview);
            setImagePreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleVideoFileChange = (selectedFile: File | null) => {
        if (selectedFile) {
            if (!selectedFile.type.startsWith('video/')) {
                setError('Only video files are supported for analysis.');
                return;
            }
            setError(null);
            setResult(null);
            setVideoFile(selectedFile);
            if (videoPreview) URL.revokeObjectURL(videoPreview);
            setVideoPreview(URL.createObjectURL(selectedFile));
        }
    };
    
    const handleAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setStatusText('');

        try {
            let analysisResult: AnalysisResult;
            if (activeTab === 'text') {
                if (!inputText.trim()) {
                    setError('Please enter some text to analyze.');
                    setIsLoading(false);
                    return;
                }
                setStatusText('Analyzing text...');
                analysisResult = await analyzeText(inputText);
            } else if (activeTab === 'image') {
                if (!imageBase64 || !imageFile) {
                    setError('Please select an image file to analyze.');
                    setIsLoading(false);
                    return;
                }
                setStatusText('Analyzing image...');
                analysisResult = await analyzeImage(imageBase64, imageFile.type);
            } else { // Video tab
                 if (!videoFile) {
                    setError('Please select a video file to analyze.');
                    setIsLoading(false);
                    return;
                }
                setStatusText('Extracting frames from video...');
                const frames = await extractFrames(videoFile, 5); // Extract 5 frames
                setStatusText('Analyzing video frames...');
                analysisResult = await analyzeVideo(frames.map(frame => ({
                    imageBase64: frame.split(',')[1],
                    mimeType: 'image/jpeg'
                })));
            }
            setResult(analysisResult);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setStatusText('');
        }
    }, [activeTab, inputText, imageFile, imageBase64, videoFile]);

    const TabButton: React.FC<{ tab: Tab; label: string }> = ({ tab, label }) => (
        <button
            onClick={() => {
              setActiveTab(tab);
              setResult(null);
              setError(null);
            }}
            className={`px-4 py-2 text-sm sm:text-base font-medium rounded-md transition-colors duration-200 ${
                activeTab === tab 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
        >
            {label}
        </button>
    );

    const FileInput: React.FC<{ onFileChange: (file: File | null) => void; accept: string; type: 'image' | 'video'; preview: string | null; }> = ({ onFileChange, accept, type, preview }) => (
        <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                onFileChange(e.dataTransfer.files[0]);
            }}
            className="w-full p-4 bg-gray-900/70 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-purple-500 transition-colors"
            onClick={() => document.getElementById(`${type}-file-input`)?.click()}
        >
            <input id={`${type}-file-input`} type="file" accept={accept} className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] || null)} disabled={isLoading}/>
            {preview ? (
                type === 'image' ? (
                    <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-md" />
                ) : (
                    <video src={preview} controls className="max-h-48 mx-auto rounded-md" />
                )
            ) : (
                <div className="text-gray-400">
                    <p className="font-semibold">Drag & drop an {type} here</p>
                    <p className="text-sm">or click to select a file</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full bg-gray-800/30 border border-gray-700/50 rounded-xl shadow-2xl shadow-black/30 p-4 sm:p-8 backdrop-blur-sm">
            <div className="flex justify-center space-x-2 sm:space-x-4 mb-6">
                <TabButton tab="text" label="Text Analysis" />
                <TabButton tab="image" label="Image Analysis" />
                <TabButton tab="video" label="Video Analysis" />
            </div>

            {/* Input Section */}
            <div className="mb-6 min-h-[224px]">
                {activeTab === 'text' ? (
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Paste text here to analyze for AI generation..."
                        className="w-full h-48 p-4 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all duration-200 resize-none text-gray-200"
                        disabled={isLoading}
                    />
                ) : activeTab === 'image' ? (
                     <FileInput onFileChange={handleImageFileChange} accept="image/*" type="image" preview={imagePreview} />
                ) : (
                     <FileInput onFileChange={handleVideoFileChange} accept="video/*" type="video" preview={videoPreview} />
                )}
            </div>

            {/* Action Button */}
            <div className="text-center">
                <button
                    onClick={handleAnalysis}
                    disabled={isLoading || (activeTab === 'text' && !inputText) || (activeTab === 'image' && !imageFile) || (activeTab === 'video' && !videoFile)}
                    className="w-full sm:w-auto bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100"
                >
                    {isLoading ? (statusText || 'Analyzing...') : 'Analyze'}
                </button>
            </div>
            
            {/* Output Section */}
            <div className="mt-6">
              {isLoading && <Spinner text={statusText || 'Analyzing...'} />}
              {error && <div className="text-center text-red-400 bg-red-900/50 border border-red-700 rounded-lg p-3">{error}</div>}
              {result && !isLoading && <ResultDisplay result={result} />}
            </div>
        </div>
    );
};

export default Detector;
