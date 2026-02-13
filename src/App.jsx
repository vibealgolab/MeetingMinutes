import React, { useState, useEffect, useRef } from 'react';
import { UploadZone } from './components/UploadZone';
import { AudioPlayer } from './components/AudioPlayer';
import { GeminiService } from './services/gemini';
import { AudioRecorder } from './components/AudioRecorder';
import { FileList } from './components/FileList';
import { SettingsModal } from './components/SettingsModal';
import { ResultPanel } from './components/ResultPanel';
import { Settings, Loader2, Sparkles, Clock, Square, Mic, Upload } from 'lucide-react';

function App() {
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [modelName, setModelName] = useState(localStorage.getItem('gemini_model_name') || 'gemini-2.5-flash');
    const [audioLanguage, setAudioLanguage] = useState('English');
    const [summaryLanguage, setSummaryLanguage] = useState('English');
    const [showSettings, setShowSettings] = useState(!apiKey);
    const [currentFile, setCurrentFile] = useState(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    const [progressStatus, setProgressStatus] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef(null);
    const abortRef = useRef(false);

    const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'record'
    const [refreshFiles, setRefreshFiles] = useState(0);
    const [availableModels, setAvailableModels] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    useEffect(() => {
        if (apiKey) {
            fetchModels(apiKey);
        }
    }, [apiKey]);

    const fetchModels = async (key) => {
        if (!key) return;
        setIsLoadingModels(true);
        try {
            const models = await GeminiService.listModels(key);
            const validModels = models
                .filter(m => m.supportedGenerationMethods.includes("generateContent"))
                .map(m => m.name.replace('models/', ''))
                .filter(name => {
                    const isLite = name.includes('lite');
                    const isFlash = name.includes('flash');
                    const isPro = name.includes('pro');
                    const isDeprecated = name.includes('1.0') || name.includes('1.5');
                    return (isLite || isFlash) && !isPro && !isDeprecated;
                })
                .sort((a, b) => {
                    const isALite = a.includes('lite');
                    const isBLite = b.includes('lite');
                    if (isALite && !isBLite) return -1;
                    if (!isALite && isBLite) return 1;
                    return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
                });

            setAvailableModels(validModels);
            if ((!modelName || !validModels.includes(modelName)) && validModels.length > 0) {
                setModelName(validModels[0]);
            }
        } catch (error) {
            console.error("Failed to fetch models:", error);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const handleSaveSettings = (key, model) => {
        localStorage.setItem('gemini_api_key', key);
        localStorage.setItem('gemini_model_name', model);
        setApiKey(key);
        setModelName(model);
        setShowSettings(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFileSelect = async (file) => {
        let fileToSet = file;

        // In Electron, we want a stable local path.
        // If it's an external file (doesn't have our internal prefixes), import it.
        const isInternal = file.name.startsWith('imported_') || file.name.startsWith('meeting_');

        if (window.electronAPI && !isInternal) {
            try {
                setProgressStatus('Importing file to local storage...');
                setIsAnalyzing(true);

                // Read as buffer - works even if .path is missing!
                const buffer = await file.arrayBuffer();

                // Add timestamp to prevent name collision and ensure stable path
                const timestamp = new Date().getTime();
                const safeName = `imported_${timestamp}_${file.name}`;

                const result = await window.electronAPI.saveRecording(buffer, safeName);

                if (result.success) {
                    // Create a virtual file object that points to the new local path
                    const importedFile = new File([file], safeName, { type: file.type });
                    Object.defineProperty(importedFile, 'path', {
                        value: result.path,
                        writable: false,
                        enumerable: true
                    });
                    fileToSet = importedFile;
                    setRefreshFiles(prev => prev + 1); // Show in the list
                }
            } catch (err) {
                console.error("Buffer import failed:", err);
            } finally {
                setIsAnalyzing(false);
            }
        }

        setCurrentFile(fileToSet);
        setAnalysisResult(null);
        setError(null);
    };

    const handleAnalyze = async () => {
        if (!apiKey) {
            setShowSettings(true);
            return;
        }

        if (!currentFile) {
            alert('Please select a file first.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setProgressStatus('Initializing...');
        setElapsedTime(0);
        abortRef.current = false;

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const service = new GeminiService(apiKey, modelName);

            const result = await service.analyzeAudio(
                currentFile,
                audioLanguage,
                summaryLanguage,
                (status) => {
                    if (abortRef.current) return;
                    setProgressStatus(status);
                },
                () => abortRef.current
            );

            if (abortRef.current) return;
            setAnalysisResult(result);
        } catch (err) {
            if (abortRef.current) return;
            console.error(err);
            const errorMessage = err.message || JSON.stringify(err);
            if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
                setError(`Server Error (503): Google's '${modelName}' model is overloaded. Try 'flash' or wait.`);
            } else if (errorMessage.includes('429') || errorMessage.includes('Quota exceeded')) {
                setError(`Quota Error (429): The model '${modelName}' has exceeded its usage limit.`);
            } else {
                setError(`Error: ${errorMessage}. Check API Key or Model Name.`);
            }
        } finally {
            if (!abortRef.current) setIsAnalyzing(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleStop = () => {
        abortRef.current = true;
        setIsAnalyzing(false);
        setAnalysisResult(null);
        setError(null);
        setProgressStatus('Cancelled');
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setElapsedTime(0);
    };

    const handleReset = () => {
        setCurrentFile(null);
        setAnalysisResult(null);
        setError(null);
    };

    const handleDownload = (filename, content) => {
        try {
            const element = document.createElement("a");
            const file = new Blob([content], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = filename;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } catch (e) {
            console.error("Download failed:", e);
            alert("Failed to download file.");
        }
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-content">
                    <h1 onClick={handleReset} style={{ cursor: 'pointer' }}>Meeting Minutes AI</h1>
                    <button className="btn-icon" onClick={() => setShowSettings(true)} title="Settings">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            <main className="main-content">
                {showSettings && (
                    <SettingsModal
                        apiKey={apiKey}
                        modelName={modelName}
                        onSave={handleSaveSettings}
                        onCancel={() => setShowSettings(false)}
                        availableModels={availableModels}
                        isLoadingModels={isLoadingModels}
                        fetchModels={fetchModels}
                    />
                )}

                <div className="workspace">
                    <div className="panel left-panel">
                        {!currentFile ? (
                            <>
                                <div className="input-mode-switch">
                                    <button
                                        className={`mode-btn ${inputMode === 'upload' ? 'active' : ''}`}
                                        onClick={() => setInputMode('upload')}
                                    >
                                        <Upload size={18} /> Upload
                                    </button>
                                    <button
                                        className={`mode-btn ${inputMode === 'record' ? 'active' : ''}`}
                                        onClick={() => setInputMode('record')}
                                    >
                                        <Mic size={18} /> Record
                                    </button>
                                </div>

                                <div className="input-area">
                                    {inputMode === 'upload' ? (
                                        <UploadZone onFileSelect={handleFileSelect} />
                                    ) : (
                                        <AudioRecorder
                                            onFileSelect={handleFileSelect}
                                            onRecordingComplete={() => setRefreshFiles(prev => prev + 1)}
                                        />
                                    )}
                                </div>

                                <FileList onFileSelect={handleFileSelect} refreshTrigger={refreshFiles} />
                            </>
                        ) : (
                            <div className="file-ready-state">
                                <AudioPlayer file={currentFile} />

                                <div className="action-area">
                                    <div className="controls-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>Source Language</label>
                                                <select
                                                    className="select-input"
                                                    value={audioLanguage}
                                                    onChange={(e) => setAudioLanguage(e.target.value)}
                                                    disabled={isAnalyzing}
                                                    style={{
                                                        width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-main)', cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="English">🇺🇸 English</option>
                                                    <option value="Korean">🇰🇷 Korean</option>
                                                    <option value="Auto">🌐 Auto Detect</option>
                                                </select>
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>Output Language</label>
                                                <select
                                                    className="select-input"
                                                    value={summaryLanguage}
                                                    onChange={(e) => setSummaryLanguage(e.target.value)}
                                                    disabled={isAnalyzing}
                                                    style={{
                                                        width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-main)', cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="English">🇺🇸 English</option>
                                                    <option value="Korean">🇰🇷 Korean</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button className="btn btn-primary" onClick={handleAnalyze} disabled={isAnalyzing} style={{ marginTop: '0.5rem' }}>
                                            {isAnalyzing ? (
                                                <><Loader2 className="spin" size={20} /> Analyzing...</>
                                            ) : (
                                                <><Sparkles size={20} /> Analyze Meeting</>
                                            )}
                                        </button>
                                    </div>

                                    {isAnalyzing && (
                                        <div className="progress-card">
                                            <div className="status-row">
                                                <Loader2 className="spin text-primary" size={24} />
                                                <div className="status-info">
                                                    <span className="status-text-main">{progressStatus}</span>
                                                    <span className="status-subtext">Google Gemini ({modelName})</span>
                                                </div>
                                                <div className="timer-badge">
                                                    <Clock size={16} />
                                                    <span>{formatTime(elapsedTime)}</span>
                                                </div>
                                            </div>
                                            <div className="progress-bar-container">
                                                <div className={`progress-fill ${progressStatus.includes('Upload') ? 'w-30' : progressStatus.includes('Transcribing') ? 'w-60' : progressStatus.includes('Summarizing') ? 'w-90' : 'w-10'}`}></div>
                                            </div>
                                        </div>
                                    )}

                                    {error && <p className="error-text">{error}</p>}

                                    {isAnalyzing ? (
                                        <button className="btn-danger" onClick={handleStop}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                <Square size={16} fill="currentColor" />
                                                <span>Stop Analysis</span>
                                            </div>
                                        </button>
                                    ) : (
                                        <button className="btn-outline" onClick={handleReset}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                <Clock size={16} />
                                                <span>Start New Analysis</span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <ResultPanel
                        analysisResult={analysisResult}
                        isAnalyzing={isAnalyzing}
                        onDownload={handleDownload}
                    />
                </div>
            </main>
        </div>
    );
}

export default App;
