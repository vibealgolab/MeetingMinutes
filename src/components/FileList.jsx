import React, { useState, useEffect } from 'react';
import { FileAudio, RefreshCw, FolderOpen, Play, Trash2 } from 'lucide-react';

export function FileList({ onFileSelect, refreshTrigger }) {
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadFiles = async () => {
        if (!window.electronAPI) return;

        setIsLoading(true);
        try {
            const list = await window.electronAPI.listRecordings();
            // Sort by newest first (assuming filename contains date or just reversing)
            // Ideally we'd get stats, but here we just get names.
            // Since our names are meeting_YYYY-MM-DD..., reverse alpha sort works for chrono desc.
            const sorted = list.sort((a, b) => b.name.localeCompare(a.name));
            setFiles(sorted);
        } catch (error) {
            console.error("Failed to load recordings", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, [refreshTrigger]);

    const handleSelect = async (filename) => {
        if (!window.electronAPI) return;

        try {
            // Read file content
            const buffer = await window.electronAPI.readFile(filename);

            // Determine type
            const ext = filename.split('.').pop().toLowerCase();
            let type = 'audio/webm';
            if (ext === 'mp3') type = 'audio/mpeg';
            if (ext === 'wav') type = 'audio/wav';
            if (ext === 'm4a') type = 'audio/mp4'; // roughly
            if (ext === 'ogg') type = 'audio/ogg';

            const blob = new Blob([buffer], { type });
            const file = new File([blob], filename, { type });

            // Attach original path for Gemini Upload (Electron specific)
            const originalFile = files.find(f => f.name === filename);
            if (originalFile && originalFile.path) {
                Object.defineProperty(file, 'path', {
                    value: originalFile.path,
                    writable: false,
                    enumerable: true
                });
            }

            onFileSelect(file);
        } catch (error) {
            console.error("Failed to load file", error);
            alert("Failed to load file: " + filename);
        }
    };

    const handleDelete = async (e, filename) => {
        e.stopPropagation(); // Prevent file selection when clicking delete
        if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;

        try {
            const result = await window.electronAPI.deleteFile(filename);
            if (result.success) {
                loadFiles(); // Refresh list
            } else {
                alert("Failed to delete file: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Error deleting file.");
        }
    };

    if (!window.electronAPI) return null; // Don't show in web mode

    return (
        <div className="file-list-container">
            <div className="list-header">
                <h3>Recordings</h3>
                <div className="header-actions">
                    <button className="btn-icon-sm" onClick={() => window.electronAPI.openRecordingsFolder()} title="Open Folder">
                        <FolderOpen size={16} />
                    </button>
                    <button className="btn-icon-sm" onClick={loadFiles} title="Refresh" disabled={isLoading}>
                        <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="list-body">
                {files.length === 0 ? (
                    <div className="empty-state">
                        <p>No recordings found.</p>
                        <small>Local recordings will appear here.</small>
                    </div>
                ) : (
                    <ul>
                        {files.map((file, idx) => (
                            <li key={idx} onClick={() => handleSelect(file.name)} className="file-item">
                                <FileAudio size={16} className="file-icon" />
                                <span className="file-name" title={file.name}>{file.name}</span>
                                <div className="item-actions">
                                    <button
                                        className="btn-icon-xs delete-btn"
                                        onClick={(e) => handleDelete(e, file.name)}
                                        title="Delete Recording"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <Play size={14} className="play-icon" />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <style jsx>{`
                .file-list-container {
                    margin-top: 2rem;
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    max-height: 300px;
                }

                .list-header {
                    padding: 0.75rem 1rem;
                    background: var(--color-bg);
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .list-header h3 {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--color-text-muted);
                    margin: 0;
                }

                .header-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .list-body {
                    overflow-y: auto;
                    padding: 0.5rem;
                }

                .empty-state {
                    padding: 2rem;
                    text-align: center;
                    color: var(--color-text-muted);
                    font-size: 0.9rem;
                }

                ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .file-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.6rem 0.75rem;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: background 0.2s;
                    color: var(--color-text-main);
                    font-size: 0.9rem;
                    position: relative;
                }

                .file-item:hover {
                    background: var(--color-surface-hover);
                }

                .file-icon {
                    color: var(--color-primary);
                    flex-shrink: 0;
                }

                .file-name {
                    flex: 1;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .item-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .play-icon {
                    opacity: 0;
                    color: var(--color-text-muted);
                    transition: opacity 0.2s;
                }

                .file-item:hover .play-icon {
                    opacity: 1;
                }

                .btn-icon-xs {
                    background: transparent;
                    border: none;
                    color: var(--color-text-muted);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0; 
                    transition: all 0.2s;
                }

                .file-item:hover .btn-icon-xs {
                    opacity: 1;
                }

                .delete-btn:hover {
                    color: #ef4444;
                    background-color: rgba(239, 68, 68, 0.1);
                }
            `}</style>
        </div>
    );
}
