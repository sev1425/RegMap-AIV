import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, File, X, CheckCircle, AlertCircle, FileText, ArrowRight, BrainCircuit, ScanText, Database } from "lucide-react";
import { useUpload } from "../hooks/useUpload";
import "./Regulations.css";

export default function Regulations({ setActivePage }) {
    const {
        file,
        isDragging,
        status,
        progress,
        result,
        error,
        onDragOver,
        onDragLeave,
        onDrop,
        onFileSelect,
        clearFile,
        upload
    } = useUpload();

    const fileInputRef = useRef(null);

    const handleBrowse = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const renderDropzone = () => (
        <motion.div 
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="dropzone-card glass-panel"
        >
            <div 
                className={`dropzone-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={handleBrowse}
            >
                <motion.div
                    animate={{ y: isDragging ? -10 : 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <UploadCloud size={64} className="dropzone-icon" />
                </motion.div>
                <h3 className="h3">Drag & Drop Regulation Document</h3>
                <p className="body">or click to browse from your computer</p>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={onFileSelect}
                    style={{ display: 'none' }}
                    accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.txt"
                />
                <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={(e) => { e.stopPropagation(); handleBrowse(); }}>
                    Select File
                </button>
            </div>
            <div className="supported-formats">
                <span className="format-badge">PDF</span>
                <span className="format-badge">DOCX</span>
                <span className="format-badge">PPTX</span>
                <span className="format-badge">PNG</span>
                <span className="format-badge">TXT</span>
            </div>
        </motion.div>
    );

    const renderFileSelected = () => (
        <motion.div 
            key="selected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="dropzone-card glass-panel file-selected"
        >
            <div className="file-info">
                <div className="file-icon-container">
                    <File size={32} color="var(--accent-primary)" />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                    <div className="file-name h3">{file.name}</div>
                    <div className="file-size body">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button className="btn-icon" onClick={clearFile} title="Remove file">
                    <X size={24} color="var(--text-tertiary)" />
                </button>
            </div>
            
            <div className="action-buttons">
                <button className="btn btn-secondary" onClick={clearFile}>Cancel</button>
                <button className="btn btn-primary" onClick={upload}>Analyze Regulation</button>
            </div>
        </motion.div>
    );

    const renderProgress = () => {
        let statusText = "Uploading Document...";
        let Icon = UploadCloud;
        if (status === 'ocr') {
            statusText = "Running OCR & Extracting Text...";
            Icon = ScanText;
        }
        if (status === 'ai_processing') {
            statusText = "AI processing: Extracting Obligations & Risks...";
            Icon = BrainCircuit;
        }

        return (
            <motion.div 
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="dropzone-card glass-panel flex-center flex-column"
                style={{ padding: '60px 40px' }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="processing-icon"
                >
                    <Icon size={64} color="var(--accent-primary)" />
                </motion.div>
                
                <div className="progress-container" style={{ width: '100%', maxWidth: '500px', marginTop: '40px' }}>
                    <div className="progress-header flex-between" style={{ marginBottom: '12px' }}>
                        <span className="subtitle" style={{ fontWeight: 600 }}>{statusText}</span>
                        <span className="subtitle" style={{ color: 'var(--accent-primary)' }}>{progress}%</span>
                    </div>
                    <div className="progress-track" style={{ height: '8px', borderRadius: '4px', background: 'var(--border-light)', overflow: 'hidden' }}>
                        <motion.div 
                            className="progress-fill" 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                            style={{ height: '100%', background: 'var(--accent-primary)' }} 
                        />
                    </div>
                    <p className="caption" style={{ marginTop: '16px', textAlign: 'center' }}>Please wait while RegMap AI analyzes the document.</p>
                </div>
            </motion.div>
        );
    };

    const renderError = () => (
        <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="dropzone-card glass-panel flex-center flex-column"
            style={{ padding: '60px 40px' }}
        >
            <AlertCircle size={64} color="var(--danger)" style={{ marginBottom: '24px' }} />
            <h3 className="h2" style={{ color: 'var(--danger)', marginBottom: '8px' }}>Analysis Failed</h3>
            <p className="body" style={{ marginBottom: '32px' }}>{error}</p>
            <button className="btn btn-primary" onClick={clearFile}>Try Again</button>
        </motion.div>
    );

    const renderSuccess = () => (
        <motion.div 
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="results-container"
        >
            <div className="results-header glass-panel">
                <div>
                    <h2 className="h2">Analysis Complete</h2>
                    <p className="body">{file.name} has been successfully processed by RegMap AI.</p>
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => setActivePage('Dashboard')}
                >
                    View Executive Dashboard <ArrowRight size={16} />
                </button>
            </div>

            <div className="results-grid">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="result-card glass-panel" 
                    style={{ gridColumn: '1 / -1' }}
                >
                    <h3 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <FileText size={24} color="var(--accent-primary)" /> Executive Summary
                    </h3>
                    <p className="body" style={{ lineHeight: '1.8' }}>{result?.executive_summary || "No summary available."}</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="result-card glass-panel"
                >
                    <h3 className="h3" style={{ marginBottom: '16px' }}>Critical Risks</h3>
                    <div className="result-list">
                        {(result?.analytics?.department_risk || {}).length === 0 && <p className="body">No risks identified.</p>}
                        {Object.entries(result?.analytics?.department_risk || {}).map(([dept, risks], i) => (
                            risks.High > 0 && (
                                <div className="result-item high" key={i}>
                                    <h4 style={{ fontWeight: 600 }}>{dept} Department</h4>
                                    <p className="caption" style={{ color: 'var(--danger)' }}>{risks.High} High Risks</p>
                                </div>
                            )
                        ))}
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="result-card glass-panel"
                >
                    <h3 className="h3" style={{ marginBottom: '16px' }}>Top Obligations</h3>
                    <div className="result-list">
                        {(result?.obligations || []).slice(0, 3).map((obl, i) => (
                            <div className={`result-item ${obl.category === 'Mandatory' ? 'high' : 'medium'}`} key={i}>
                                <h4 style={{ fontWeight: 600 }}>{obl.department || 'General'}</h4>
                                <p className="caption">{obl.obligation_text || obl.text}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="result-card glass-panel"
                >
                    <h3 className="h3" style={{ marginBottom: '16px' }}>Upcoming Deadlines</h3>
                    <div className="result-list">
                        {(result?.deadlines || []).slice(0, 3).map((dl, i) => (
                            <div className="result-item medium" key={i}>
                                <h4 style={{ fontWeight: 600 }}>{dl.date_expression || dl.deadline || 'Unknown Date'}</h4>
                                <p className="caption">{dl.deadline_text || dl.text || 'Deadline identified by AI'}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button className="btn btn-secondary" onClick={clearFile}>Upload Another Document</button>
            </div>
        </motion.div>
    );

    return (
        <div className="regulations-page">
            <div className="regulations-header">
                <h1 className="h1">Regulation Upload Center</h1>
                <p className="subtitle">Upload regulatory documents for AI extraction and analysis.</p>
            </div>

            <AnimatePresence mode="wait">
                {status === 'idle' && !file && renderDropzone()}
                {status === 'idle' && file && renderFileSelected()}
                {(status === 'uploading' || status === 'ocr' || status === 'ai_processing') && renderProgress()}
                {status === 'error' && renderError()}
                {status === 'success' && renderSuccess()}
            </AnimatePresence>
        </div>
    );
}
