import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}

export function GoogleAnalytics() {
    const [measurementId, setMeasurementId] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        // Fetch ID from backend public config
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/home/config`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.config?.googleAnalyticsId) {
                    setMeasurementId(data.config.googleAnalyticsId);
                }
            })
            .catch(err => console.error("Failed to load analytics config", err));
    }, []);

    useEffect(() => {
        if (!measurementId) return;

        // Load GA Script
        const scriptId = 'ga-gtag';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            window.gtag = function () {
                window.dataLayer.push(arguments);
            };
            window.gtag('js', new Date());
            window.gtag('config', measurementId);
        }
    }, [measurementId]);

    useEffect(() => {
        if (measurementId && window.gtag) {
            window.gtag('config', measurementId, {
                page_path: location.pathname + location.search,
            });
        }
    }, [location, measurementId]);

    return null;
}
