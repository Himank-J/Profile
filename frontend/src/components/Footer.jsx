import { Mail, Linkedin, Github } from 'lucide-react';
import './Footer.css';

// Custom X (Twitter) icon since Lucide doesn't have the new X logo
function XIcon({ size = 22 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-icons">
                <a href="mailto:himankvjain@gmail.com" className="footer-icon" aria-label="Email">
                    <Mail size={22} />
                </a>
                <a href="https://github.com/Himank-J" target="_blank" rel="noopener noreferrer" className="footer-icon" aria-label="GitHub">
                    <Github size={22} />
                </a>
                <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="footer-icon" aria-label="X">
                    <XIcon size={20} />
                </a>
                <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer" className="footer-icon" aria-label="LinkedIn">
                    <Linkedin size={22} />
                </a>
            </div>
            <p className="copyright">© 2026 Himank Jain</p>
        </footer>
    );
}

export default Footer;
