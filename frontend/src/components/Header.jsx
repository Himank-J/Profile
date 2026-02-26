import { NavLink } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import logoImg from '/favicon.png';
import './Header.css';

function Header() {
    const { isDark, toggleTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header className="header">
            <div className="header-container">
                <NavLink to="/" className="logo">
                    {/* Logo image — fades in on scroll */}
                    <img
                        src={logoImg}
                        alt="Himank Jain logo"
                        className={`logo-icon ${scrolled ? 'logo-icon--visible' : ''}`}
                    />
                    {/* Full name — slides out on scroll */}
                    <span className={`logo-name ${scrolled ? 'logo-name--hidden' : ''}`}>
                        Himank Jain
                    </span>
                </NavLink>

                <nav className="nav">
                    <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        Blog
                    </NavLink>
                    <NavLink to="/projects" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        Projects
                    </NavLink>
                    <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        About
                    </NavLink>

                    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </nav>
            </div>
        </header>
    );
}

export default Header;
