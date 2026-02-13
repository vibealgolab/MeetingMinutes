import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Monitor } from 'lucide-react';

export function AudioRecorder({ onFileSelect, onRecordingComplete }) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [captureSystemAudio, setCaptureSystemAudio] = useState(false);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioContextRef = useRef(null);
    const streamsRef = useRef([]);

    useEffect(() => {
        return () => {
            cleanupRecording();
        };
    }, []);

    const cleanupRecording = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        // Stop all tracked streams (mic & system)
        streamsRef.current.forEach(stream => {
            stream.getTracks().forEach(track => track.stop());
        });
        streamsRef.current = [];

        // Close AudioContext
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const startRecording = async () => {
        try {
            let finalStream;
            streamsRef.current = [];

            if (captureSystemAudio) {
                // 1. Get System Audio (via Screen Share)
                // Note: video: true is required to trigger the picker, even if we only want audio.
                let displayStream;
                try {
                    displayStream = await navigator.mediaDevices.getDisplayMedia({
                        video: true,
                        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
                    });
                } catch (err) {
                    // User cancelled screen picker
                    return;
                }

                // Verify user shared audio
                if (displayStream.getAudioTracks().length === 0) {
                    alert("System audio was not shared. Please check the 'Share audio' box in the screen picker.");
                    displayStream.getTracks().forEach(t => t.stop());
                    return;
                }

                // 2. Get Microphone
                const micStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true }
                });

                streamsRef.current.push(displayStream, micStream);

                // 3. Mix streams using AudioContext
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioContext = new AudioContext();
                audioContextRef.current = audioContext;

                const micSource = audioContext.createMediaStreamSource(micStream);
                const sysSource = audioContext.createMediaStreamSource(displayStream);
                const dest = audioContext.createMediaStreamDestination();

                // Mix both to destination
                micSource.connect(dest);
                sysSource.connect(dest);

                finalStream = dest.stream;

                // Stop recording if user stops screen sharing via browser UI
                displayStream.getVideoTracks()[0].onended = () => {
                    stopRecording();
                };

            } else {
                // Standard Microphone Only
                finalStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamsRef.current.push(finalStream);
            }

            // --- Initialize MediaRecorder with the final stream ---
            mediaRecorderRef.current = new MediaRecorder(finalStream, { mimeType: 'audio/webm' });
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                setIsSaving(true);
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

                // Generate filename
                const now = new Date();
                const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const filename = captureSystemAudio
                    ? `meeting_system_audio_${timestamp}.webm`
                    : `meeting_${timestamp}.webm`;

                try {
                    if (window.electronAPI) {
                        const buffer = await blob.arrayBuffer();
                        await window.electronAPI.saveRecording(buffer, filename);
                        if (onRecordingComplete) onRecordingComplete();
                    } else {
                        const file = new File([blob], filename, { type: 'audio/webm' });
                        onFileSelect(file);
                    }
                } catch (error) {
                    console.error("Failed to save recording", error);
                    alert("Failed to save recording. Check folder permissions.");
                } finally {
                    setIsSaving(false);
                    setDuration(0);
                    cleanupRecording(); // Ensure deep cleanup
                    setIsRecording(false); // UI update
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing media devices:", err);
            alert("Could not access microphone or system audio. Please check permissions.");
            cleanupRecording();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        } else {
            // If already stopped or error
            cleanupRecording();
            setIsRecording(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`recorder-container ${isRecording ? 'recording' : ''}`}>
            {!isRecording && !isSaving && (
                <div className="options-bar">
                    <label className="checkbox-label" title="Record computer sounds (Zoom/Teams) along with your mic">
                        <input
                            type="checkbox"
                            checked={captureSystemAudio}
                            onChange={(e) => setCaptureSystemAudio(e.target.checked)}
                        />
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Monitor size={16} /> Include System Audio
                        </span>
                    </label>
                </div>
            )}

            {isSaving ? (
                <div className="saving-state">
                    <Loader2 className="spin" size={24} />
                    <span>Saving Recording...</span>
                </div>
            ) : !isRecording ? (
                <button className="btn-record start" onClick={startRecording}>
                    <Mic size={24} />
                    <span>Start Recording</span>
                </button>
            ) : (
                <div className="recording-active">
                    <div className="recording-indicator">
                        <div className="pulse-dot"></div>
                        <span className="timer">{formatTime(duration)}</span>
                    </div>
                    <button className="btn-record stop" onClick={stopRecording}>
                        <Square size={24} fill="currentColor" />
                        <span>Stop</span>
                    </button>
                </div>
            )}

            <style jsx>{`
                .recorder-container {
                    padding: 1.5rem;
                    border: 2px dashed var(--color-border);
                    border-radius: var(--radius-lg);
                    background: var(--color-surface);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    transition: all 0.3s ease;
                    gap: 1.5rem;
                }

                .recorder-container.recording {
                    border-color: #ef4444;
                    background: rgba(239, 68, 68, 0.05);
                }

                .options-bar {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    font-size: 0.9rem;
                    color: var(--color-text-main);
                    user-select: none;
                    padding: 0.5rem 0.75rem;
                    background: var(--color-bg);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    transition: all 0.2s;
                }

                .checkbox-label:hover {
                    background: var(--color-surface-hover);
                    border-color: var(--color-primary);
                }

                .checkbox-label input {
                    accent-color: var(--color-primary);
                    width: 16px;
                    height: 16px;
                }

                .btn-record {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: 2rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .btn-record.start {
                    background-color: var(--color-primary);
                    color: white;
                }
                .btn-record.start:hover {
                    background-color: var(--color-primary-dark);
                }

                .btn-record.stop {
                    background-color: #ef4444;
                    color: white;
                }
                .btn-record.stop:hover {
                    background-color: #dc2626;
                }

                .recording-active {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }

                .recording-indicator {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .timer {
                    font-family: monospace;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #ef4444;
                }

                .pulse-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background-color: #ef4444;
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                
                .saving-state {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--color-text-muted);
                }
            `}</style>
        </div>
    );
}
