import React, { useState } from 'react';
import { Sparkles, FileText, ArrowDownToLine, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ResultPanel({ analysisResult, isAnalyzing, onDownload }) {
    const [showTranscript, setShowTranscript] = useState(false);

    if (!analysisResult && !isAnalyzing) return null;

    return (
        <div className={`panel right-panel ${showTranscript ? 'show-all' : 'focus-summary'}`}>
            {/* Summary Section */}
            <div className="result-card summary-card">
                <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={18} className="text-primary" />
                        <h3>AI Summary</h3>
                    </div>
                    <div className="header-actions">
                        {analysisResult && (
                            <>
                                <button
                                    className={`btn-toggle ${showTranscript ? 'active' : ''}`}
                                    onClick={() => setShowTranscript(!showTranscript)}
                                    title={showTranscript ? "Hide Transcript" : "Show Transcript"}
                                >
                                    {showTranscript ? <EyeOff size={16} /> : <Eye size={16} />}
                                    <span>{showTranscript ? "Hide Transcript" : "Show Transcript"}</span>
                                </button>

                                <button
                                    className="btn-icon-sm"
                                    onClick={() => onDownload(`summary_${Date.now()}.md`, analysisResult.summary)}
                                    title="Save Summary"
                                >
                                    <ArrowDownToLine size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <div className="card-body">
                    {isAnalyzing ? (
                        <div className="skeleton-loader">
                            <div className="skeleton-line" style={{ width: '80%' }}></div>
                            <div className="skeleton-line" style={{ width: '90%' }}></div>
                            <div className="skeleton-line" style={{ width: '60%' }}></div>
                        </div>
                    ) : (
                        <div className="markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {analysisResult.summary}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>

            {/* Transcript Section - Conditional */}
            {showTranscript && (
                <div className="result-card transcript-card animate-slide-in">
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={18} className="text-muted" />
                            <h3>Full Transcript</h3>
                        </div>
                        {analysisResult && (
                            <button
                                className="btn-icon-sm"
                                onClick={() => onDownload(`transcript_${Date.now()}.txt`, analysisResult.transcript)}
                                title="Save Transcript"
                            >
                                <ArrowDownToLine size={18} />
                            </button>
                        )}
                    </div>
                    <div className="card-body">
                        {isAnalyzing ? (
                            <div className="skeleton-loader">
                                <div className="skeleton-line"></div>
                                <div className="skeleton-line"></div>
                                <div className="skeleton-line"></div>
                            </div>
                        ) : (
                            <p className="whitespace-pre-wrap text-sm">{analysisResult.transcript}</p>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .btn-toggle {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    background: var(--color-surface-hover);
                    border: 1px solid var(--color-border);
                    color: var(--color-text-muted);
                    padding: 0.4rem 0.8rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-toggle:hover {
                    color: var(--color-text-main);
                    border-color: var(--color-primary);
                }
                .btn-toggle.active {
                    background: rgba(59, 130, 246, 0.1);
                    color: var(--color-primary);
                    border-color: var(--color-primary);
                }
                .animate-slide-in {
                    animation: slideIn 0.3s ease-out;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
