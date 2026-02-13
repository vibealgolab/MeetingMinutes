
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
    constructor(apiKey, modelName = "gemini-2.5-flash") {
        this.apiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
    }

    /**
     * Converts a File object to a Base64 string usable by Gemini
     */
    async fileToGenerativePart(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result.split(',')[1];
                resolve({
                    inlineData: {
                        data: base64Data,
                        mimeType: file.type
                    },
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Analyzes the audio file to generate a transcript and summary.
     */
    async analyzeAudio(file, audioLanguage = 'English', summaryLanguage = 'English', onProgress = () => { }, checkAbort = null) {
        try {
            if (checkAbort && checkAbort()) throw new Error("Analysis cancelled by user");

            onProgress("Starting analysis...");

            // Logic to determine upload method
            let audioPart;
            const hasElectronAPI = window.electronAPI && window.electronAPI.uploadToGemini;

            console.log("Environment Check - Electron API available:", !!hasElectronAPI);

            if (hasElectronAPI) {
                // Electron Mode
                const filePath = file.path || file.name;
                onProgress(`Uploading via Application System (${filePath})...`);

                try {
                    const fileUri = await window.electronAPI.uploadToGemini({
                        apiKey: this.apiKey,
                        filePath: filePath,
                        mimeType: file.type || 'audio/webm'
                    });

                    if (!fileUri) throw new Error("Upload failed: No URI returned.");

                    audioPart = {
                        fileData: {
                            fileUri: fileUri,
                            mimeType: file.type || 'audio/webm'
                        }
                    };
                } catch (uploadError) {
                    console.error("Electron Upload Failed:", uploadError);
                    throw new Error(`System Upload Failed: ${uploadError.message}`);
                }

            } else {
                // Web/Fallback Mode
                if (!(file instanceof Blob)) {
                    // If it's a plain object (from FileList) and Preload failed, we can't read it.
                    throw new Error("System Error: 'electronAPI' is missing and file path cannot be read. Please restart the app.");
                }

                onProgress("Processing locally (Large files may take longer)...");
                audioPart = await this.fileToGenerativePart(file);
            }

            if (checkAbort && checkAbort()) throw new Error("Analysis cancelled by user");

            let languageInstruction = "";
            if (audioLanguage === 'Auto') {
                languageInstruction = "Detect the language of the meeting automatically.";
            } else {
                languageInstruction = `The meeting is conducted in ${audioLanguage}.`;
            }

            // 1. Generate Transcript (Dedicated Call to maximize token limit)
            const transcriptPrompt = `
                You are an expert professional stenographer.
                I am providing an audio recording of a meeting. ${languageInstruction}
                
                **TASK**:
                Provide a FULL, VERBATIM transcript of the conversation in the original spoken language.
                - **CRITICAL**: You MUST distinguish between different speakers. Use "Speaker A", "Speaker B", etc., or their names if mentioned.
                - Format each line as: "**Speaker X**: [Content]"
                - Do NOT summarize. Do NOT leave out details. Capture every sentence.
                - Fix only simple stuttering; keep the full context and nuance.
            `;

            console.log("Requesting Transcript...");
            onProgress("Transcribing conversation (this may take a minute)..."); // STAGE 2

            if (checkAbort && checkAbort()) throw new Error("Analysis cancelled by user");

            const transcriptResult = await this.model.generateContent([transcriptPrompt, audioPart]);
            const transcriptText = transcriptResult.response.text().trim();

            if (checkAbort && checkAbort()) throw new Error("Analysis cancelled by user");

            // 2. Generate Summary (Separate Call)
            const summaryPrompt = `
                You are an expert project manager and professional meeting minute taker.
                I am providing an audio recording of a meeting. ${languageInstruction}
                
                **TASK**:
                Provide a professional structured meeting minutes in ${summaryLanguage} using Markdown.
                You MUST divide the summary into the following 5 sections EXACTLY (use these headers):
                
                ## 1. ⭐ Key Decisions
                - List ONLY the final decisions or approved items.
                - Be specific.
                
                ## 2. ✅ Action Items
                - Format: [Who] What to do (By when if mentioned).
                - Group by person if possible.
                - If no specific person, mark as [Team] or [Unassigned].
                
                ## 3. ⚠️ Issues & Risks
                - Any concerns, blockers, or potential risks mentioned.
                - Negative feedback or warnings.
                
                ## 4. 📝 Detailed Summary
                - Categorize items into [Done] and [Plan] where applicable.
                - Summarize the flow of discussion logically.
                - Capture the context of why decisions were made.
                
                ## 5. 💡 Open Questions
                - Topics that were discussed but unresolved or deferred (Parking Lot).
                - Questions that need follow-up.
                
                **Style Guidelines**:
                - Be comprehensive but concise.
                - Use bullet points (-) for clarity.
                - Do NOT omit important details.
            `;

            console.log("Requesting Summary...");
            onProgress("Summarizing & Extracting Insights..."); // STAGE 3

            if (checkAbort && checkAbort()) throw new Error("Analysis cancelled by user");

            const summaryResult = await this.model.generateContent([summaryPrompt, audioPart]);
            const summaryText = summaryResult.response.text().trim();

            return {
                transcript: transcriptText,
                summary: summaryText
            };
        } catch (error) {
            // Re-throw if it's our navigation error, or legitimate API error
            // CheckAbort will be handled by caller
            if (error.message === "Analysis cancelled by user") {
                console.log("Process aborted inside service.");
            }
            throw error;
        }
    }

    static async listModels(apiKey) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            if (!response.ok) throw new Error(response.statusText);
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.error("List Models Error:", error);
            throw error;
        }
    }
}
