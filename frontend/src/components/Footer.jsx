import { Mail, Linkedin, Github, Rss } from 'lucide-react';
import Imprint from './Imprint';
import './Footer.css';

// Custom X (Twitter) icon since Lucide doesn't have the new X logo
function XIcon({ size = 22 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function trackSocial(platform) {
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'social_link_click', { platform });
    }
}

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-icons">
                <a href="https://mail.google.com/mail/?view=cm&to=himankvjain@gmail.com" target="_blank" rel="noopener noreferrer" className="footer-icon" aria-label="Email" onClick={() => trackSocial('email')}>
                    <Mail size={22} />
                </a>
                <a href="https://github.com/Himank-J" target="_blank" rel="noopener noreferrer" className="footer-icon" aria-label="GitHub" onClick={() => trackSocial('github')}>
                    <Github size={22} />
                </a>
                <a href="https://x.com/HimankJain85627" target="_blank" rel="noopener noreferrer" className="footer-icon" aria-label="X" onClick={() => trackSocial('twitter')}>
                    <XIcon size={20} />
                </a>
                <a href="https://linkedin.com/in/himank-jain" target="_blank" rel="noopener noreferrer" className="footer-icon" aria-label="LinkedIn" onClick={() => trackSocial('linkedin')}>
                    <Linkedin size={22} />
                </a>
            </div>
            <p className="copyright">© 2026 Himank Jain</p>
            <div className="footer-meta">
                <Imprint />
                <a
                    href="/feed.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="imprint-btn rss-btn"
                    aria-label="RSS Feed"
                >
                    <Rss size={12} />
                    RSS
                </a>
            </div>
        </footer>
    );
}

export default Footer;
