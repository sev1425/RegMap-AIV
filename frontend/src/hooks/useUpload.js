import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { uploadDocument } from '../api/uploadApi';
import { useGlobalContext } from '../context/GlobalContext';

export function useUpload() {
    const { triggerGlobalRefresh } = useGlobalContext();
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Status can be: 'idle', 'uploading', 'ocr', 'ai_processing', 'success', 'error'
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
        }
    }, []);

    const onFileSelect = useCallback((e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    }, []);

    const clearFile = useCallback(() => {
        setFile(null);
        setStatus('idle');
        setProgress(0);
        setResult(null);
        setError(null);
    }, []);

    const upload = useCallback(async () => {
        if (!file) return;

        setStatus('uploading');
        setProgress(10);
        setError(null);

        // Simulate upload & processing stages while we wait for backend
        const stages = [
            { status: 'ocr', progress: 30, time: 1500 },
            { status: 'ai_processing', progress: 60, time: 3500 },
            { status: 'ai_processing', progress: 90, time: 5000 }
        ];

        const timeouts = stages.map(stage => 
            setTimeout(() => {
                setStatus(stage.status);
                setProgress(stage.progress);
            }, stage.time)
        );

        try {
            const response = await uploadDocument(file);
            
            // Clear simulated timeouts since we got the real response
            timeouts.forEach(clearTimeout);

            if (response.success) {
                setStatus('success');
                setProgress(100);
                setResult(response.data);
                triggerGlobalRefresh();

                toast.success('Analysis complete! All modules updated.');

                // Notify about high risks
                const highRisks = (response.data?.risks || []).filter(r => r.severity === 'High').length;
                if (highRisks > 0) {
                    setTimeout(() => toast(`⚠️ ${highRisks} high-risk finding(s) detected`, { icon: '🔴', duration: 5000 }), 1500);
                }

                // Notify about warnings (like OCR failure)
                const warnings = response.data?.warnings || [];
                warnings.forEach((warning, idx) => {
                    setTimeout(() => toast(warning, { icon: '⚠️', duration: 6000 }), 2000 + (idx * 500));
                });
            } else {
                setStatus('error');
                setError(response.message || 'Upload failed');
                toast.error(response.message || 'Upload failed');
            }
        } catch (err) {
            timeouts.forEach(clearTimeout);
            setStatus('error');
            const msg = err.message || 'An error occurred during upload';
            setError(msg);
            toast.error(msg);
        }
    }, [file, triggerGlobalRefresh]);

    return {
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
    };
}
