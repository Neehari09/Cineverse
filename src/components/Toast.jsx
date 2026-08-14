import React, { useState, useEffect } from 'react';
import './Toast.css';

// Utility to dispatch a toast event
export const showToast = (message, type = 'success') => {
    const event = new CustomEvent('show-toast', { detail: { message, type } });
    window.dispatchEvent(event);
};

export default function ToastContainer() {
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const handleToast = (e) => {
            setToast({ message: e.detail.message, type: e.detail.type, id: Date.now() });
        };
        window.addEventListener('show-toast', handleToast);
        return () => window.removeEventListener('show-toast', handleToast);
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    if (!toast) return null;

    return (
        <div className={`cv-toast-wrapper`}>
            <div className={`cv-toast cv-toast-${toast.type} slide-in-toast`} key={toast.id}>
                {toast.type === 'success' && <span className="cv-toast-icon">✓</span>}
                {toast.type === 'error' && <span className="cv-toast-icon">✕</span>}
                {toast.message}
            </div>
        </div>
    );
}
