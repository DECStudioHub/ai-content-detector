// services/geminiService.ts

import { GoogleGenerativeAI, GenerateContentResult, Part } from "@google/generative-ai"; // FIXED: Imported missing types
import { AnalysisResult } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not set");
}

// This is correct, no changes needed
const ai = new GoogleGenerativeAI({ apiKey: apiKey });

// REMOVED: Deleted the old string variables. We will create model objects inside the functions.
// const textModel = '...';
// const visionModel = '...';

// This function is correct, no changes needed
const parseJsonResponse = (rawText: string): AnalysisResult | null => {
    let jsonStr = rawText.trim();
    // This regex is good for cleaning up markdown code fences
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }

    try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.determination && typeof parsed.confidence === 'number' && parsed.rationale) {
            return parsed as AnalysisResult;
        }
        return null;
    } catch (e) {
        console.error("Failed to parse JSON response:", e);
        console.error("Raw response text was:", rawText);
        return null;
    }
};

// All prompts are correct, no changes needed
const textAnalysisPrompt = `
You are an expert in distinguishing between human-written and AI-generated text. Analyze the following text and determine if it was likely written by an AI.
Consider factors like perplexity, burstiness, complexity, and common AI writing patterns.

Provide your response in a valid JSON object with the following structure:
{
  "determination": "Likely AI-Generated" | "Likely Human-Generated" | "Inconclusive",
  "confidence": <a number between 0 and 100 representing your confidence>,
  "rationale": "<A detailed explanation of your reasoning, highlighting specific characteristics of the text that led to your conclusion. Use markdown for formatting.>"
}

Here is the text to analyze:
---
`;

const imageAnalysisPrompt = `
You are an expert in detecting AI-generated images. Analyze the following image for common artifacts of AI generation, such as unnatural textures, strange anatomy (especially hands and eyes), distorted backgrounds, nonsensical text, an overly perfect/glossy appearance, or inconsistent lighting.

Provide your response in a valid JSON object with the following structure:
{
  "determination": "Likely AI-Generated" | "Likely Human-Generated" | "Inconclusive",
  "confidence": <a number between 0 and 100 representing your confidence>,
  "rationale": "<A detailed explanation of your reasoning, pointing out specific visual elements in the image that support your conclusion. Use markdown for formatting.>"
}
`;

const videoAnalysisPrompt = `
You are an expert in detecting AI-generated video content. You will be given a series of frames sampled from a video. Analyze these frames collectively to determine if the video was likely AI-generated.

Look for two types of clues:
1.  **Intra-frame artifacts:** Within each individual frame, look for common AI image generation artifacts like unnatural textures, strange anatomy (hands, eyes, teeth), distorted backgrounds, nonsensical text, overly glossy appearance, or inconsistent lighting.
2.  **Inter-frame inconsistencies:** Across the sequence of frames, look for temporal artifacts. Does the background subtly warp or shift unnaturally between frames? Do objects or people flicker, morph, or lack temporal coherence? Is the motion smooth or does it have a "boiling" or jittery quality common in AI video?

Synthesize your findings from all frames to make a final determination.

Provide your response in a valid JSON object with the following structure:
{
  "determination": "Likely AI-Generated" | "Likely Human-Generated" | "Inconclusive",
  "confidence": <a number between 0 and 100 representing your confidence>,
  "rationale": "<A detailed explanation of your reasoning, pointing out specific visual elements within frames and temporal inconsistencies across the sequence that support your conclusion. Use markdown for formatting.>"
}
`;

export const analyzeText = async (text: string): Promise<AnalysisResult> => {
    try {
        // ADDED: Create the model object right before you use it.
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // FIXED: Call generateContent on the 'model' object, not 'ai.models'.
        // The response handling is also updated to the correct SDK pattern.
        const result: GenerateContentResult = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `${textAnalysisPrompt}\n${text}` }] }],
            generationConfig: { // FIXED: 'config' should be 'generationConfig'
                responseMimeType: "application/json",
                temperature: 0.2,
            },
        });
        
        const response = result.response;
        const parsedResult = parseJsonResponse(response.text()); // FIXED: use response.text() function
        
        if (parsedResult) {
            return parsedResult;
        } else {
            throw new Error("Failed to parse the analysis result from the API.");
        }
    } catch (error) {
        console.error("Error analyzing text:", error);
        throw new Error("The AI model could not analyze the text. Please try again.");
    }
};

export const analyzeImage = async (imageBase64: string, mimeType: string): Promise<AnalysisResult> => {
    try {
        // ADDED: Create the model object right before you use it.
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const imagePart: Part = { // ADDED: type for clarity
            inlineData: {
                data: imageBase64,
                mimeType,
            },
        };

        const textPart: Part = { // ADDED: type for clarity
            text: imageAnalysisPrompt,
        };
        
        // FIXED: The structure of calling generateContent and handling the response.
        const result: GenerateContentResult = await model.generateContent({
            contents: [{ role: "user", parts: [textPart, imagePart] }],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
            },
        });
        
        const response = result.response;
        const parsedResult = parseJsonResponse(response.text());
        
        if (parsedResult) {
            return parsedResult;
        } else {
            throw new Error("Failed to parse the analysis result from the API.");
        }

    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("The AI model could not analyze the image. Please try again.");
    }
};

export const analyzeVideo = async (frames: { imageBase64: string; mimeType: string }[]): Promise<AnalysisResult> => {
    try {
        // ADDED: Create the model object right before you use it.
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const textPart: Part = {
            text: videoAnalysisPrompt,
        };

        const imageParts: Part[] = frames.map(frame => ({
            inlineData: {
                data: frame.imageBase64,
                mimeType: frame.mimeType,
            },
        }));
        
        // FIXED: The structure of calling generateContent and handling the response.
        const result: GenerateContentResult = await model.generateContent({
            contents: [{ role: "user", parts: [textPart, ...imageParts] }],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
            },
        });
        
        const response = result.response;
        const parsedResult = parseJsonResponse(response.text());
        
        if (parsedResult) {
            return parsedResult;
        } else {
            throw new Error("Failed to parse the analysis result from the API.");
        }

    } catch (error) {
        console.error("Error analyzing video:", error);
        throw new Error("The AI model could not analyze the video. Please try again.");
    }
};
