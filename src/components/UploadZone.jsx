import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

export function UploadZone({ onFileSelect }) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            validateAndPassFile(files[0]);
        }
    }, [onFileSelect]);

    const handleFileInput = useCallback((e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            validateAndPassFile(files[0]);
        }
    }, [onFileSelect]);

    const validateAndPassFile = (file) => {
        // Basic validation for audio types
        if (file.type.startsWith('audio/') || file.type === 'video/webm') {
            onFileSelect(file);
        } else {
            alert('Please upload an audio file (MP3, WAV, WebM, etc.)');
        }
    };

    return (
        <div
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
        >
            <input
                type="file"
                id="file-input"
                style={{ display: 'none' }}
                accept="audio/*,video/webm"
                onChange={handleFileInput}
            />

            <div className="upload-content">
                <div className="icon-wrapper">
                    <Upload size={48} color={isDragging ? '#60a5fa' : '#94a3b8'} />
                </div>
                <h3>Drag & Drop your meeting recording</h3>
                <p>or click to browse files (MP3, WebM, WAV)</p>
            </div>

            <style jsx>{`
        .upload-zone {
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-lg);
          padding: 4rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--color-surface);
        }
        
        .upload-zone:hover, .upload-zone.dragging {
          border-color: var(--color-primary);
          background: var(--color-surface-hover);
        }

        .upload-content h3 {
          margin-top: 1.5rem;
          color: var(--color-text-main);
          font-size: 1.25rem;
        }

        .upload-content p {
          color: var(--color-text-muted);
          margin-top: 0.5rem;
        }

        .icon-wrapper {
          background: rgba(148, 163, 184, 0.1);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }

        .upload-zone:hover .icon-wrapper {
          transform: scale(1.1);
        }
      `}</style>
        </div>
    );
}
