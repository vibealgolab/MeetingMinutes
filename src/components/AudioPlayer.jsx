import React, { useEffect, useRef } from 'react';

export function AudioPlayer({ file }) {
    const audioRef = useRef(null);

    useEffect(() => {
        if (file && audioRef.current) {
            const url = URL.createObjectURL(file);
            audioRef.current.src = url;
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    return (
        <div className="audio-player-container">
            <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
            <audio ref={audioRef} controls className="native-audio" />

            <style jsx>{`
        .audio-player-container {
          background: var(--color-bg);
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          margin-bottom: 1.5rem;
        }

        .file-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }

        .file-name {
          color: var(--color-text-main);
          font-weight: 500;
        }

        .native-audio {
          width: 100%;
          height: 40px;
        }
      `}</style>
        </div>
    );
}
