import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function NotFound() {
    const location = useLocation();

    useEffect(() => {
        if (typeof window.gtag === 'function') {
            window.gtag('event', 'page_not_found', {
                attempted_path: location.pathname,
                page_location: window.location.href,
            });
        }
    }, [location]);

    return (
        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 700, marginBottom: '0.5rem' }}>404</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.6 }}>
                Page not found
            </p>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={16} /> Back to Home
            </Link>
        </div>
    );
}

export default NotFound;
