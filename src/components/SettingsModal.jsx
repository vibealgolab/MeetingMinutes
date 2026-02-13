import React, { useState } from 'react';
import { Settings, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/gemini';

export function SettingsModal({ apiKey, modelName, onSave, onCancel, availableModels, isLoadingModels, fetchModels }) {
    const [localKey, setLocalKey] = useState(apiKey);
    const [localModel, setLocalModel] = useState(modelName);

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>App Settings</h2>

                <div className="setting-group">
                    <label>Google API Key</label>
                    <input
                        type="password"
                        placeholder="Enter your Gemini API Key"
                        className="input-field"
                        value={localKey}
                        onChange={(e) => setLocalKey(e.target.value)}
                        onBlur={(e) => fetchModels(e.target.value)}
                        id="api-key-input"
                    />
                </div>

                <div className="setting-group">
                    <label>Model Name</label>
                    <p className="hint-text">Select a model or enter a custom one.</p>
                    {isLoadingModels ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            <Loader2 className="spin" size={16} /> Loading models...
                        </div>
                    ) : (
                        <select
                            className="select-input"
                            value={localModel}
                            onChange={(e) => setLocalModel(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg)',
                                color: 'var(--color-text-main)',
                                marginBottom: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">-- Select a Model --</option>
                            {availableModels.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    )}

                    <input
                        type="text"
                        placeholder="Or enter custom model name..."
                        className="input-field"
                        value={localModel}
                        onChange={(e) => setLocalModel(e.target.value)}
                        id="model-name-input"
                        style={{ marginTop: '0.5rem' }}
                    />
                </div>

                <div className="modal-actions">
                    <button
                        className="btn"
                        onClick={() => onSave(localKey, localModel)}
                    >
                        Save & Continue
                    </button>

                    <button
                        className="btn btn-secondary"
                        style={{ marginTop: '0.5rem', backgroundColor: '#334155' }}
                        onClick={async () => {
                            if (!localKey) { alert("Please enter API Key first"); return; }
                            try {
                                const models = await GeminiService.listModels(localKey);
                                const modelNames = models
                                    .filter(m => m.supportedGenerationMethods.includes("generateContent"))
                                    .map(m => m.name.replace('models/', ''))
                                    .join('\n');
                                alert("Available Models for your Key:\n\n" + modelNames);
                            } catch (e) {
                                alert("Failed to list models: " + e.message);
                            }
                        }}
                    >
                        Check Available Models
                    </button>

                    {apiKey && (
                        <button className="btn-text" onClick={onCancel}>Cancel</button>
                    )}
                </div>
                <p className="help-text">
                    Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Get one here</a>.
                </p>
            </div>
            <style jsx>{`
                .setting-group { margin-bottom: 1rem; }
                .setting-group label { display: block; margin-bottom: 0.5rem; color: var(--color-text-main); font-weight: 500; }
                .hint-text { font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.5rem; margin-top: -0.25rem; }
            `}</style>
        </div>
    );
}
