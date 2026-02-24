import { useEffect, useState } from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import SEO from '../components/SEO';
import WarpBackground from '../components/WarpBackground';
import profilePhoto from '/profile-photo.jpg';
import './About.css';

const ROLES = [
    'AI/ML Engineer',
    'LLM/NLP Practitioner',
    'Building Scalable AI Systems',
    'Applied AI Educator',
];

const SKILLS = [
    { name: 'Python', emoji: '🐍' },
    { name: 'PyTorch', emoji: '🔥' },
    { name: 'LangChain', emoji: '🔗' },
    { name: 'FastAPI', emoji: '⚡' },
    { name: 'Docker', emoji: '🐳' },
    { name: 'AWS', emoji: '☁️' },
    { name: 'Hugging Face', emoji: '🤗' },
    { name: 'RAG', emoji: '🧩' },
    { name: 'LLMs', emoji: '🤖' },
    { name: 'Vector DBs', emoji: '🗄️' },
];

function About() {
    const [roleIndex, setRoleIndex] = useState(0);
    const [displayText, setDisplay] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fullText = ROLES[roleIndex];
        let timeout;

        if (!isDeleting && displayText === fullText) {
            // pause before deleting
            timeout = setTimeout(() => setIsDeleting(true), 1800);
        } else if (isDeleting && displayText === '') {
            // move to next role
            setIsDeleting(false);
            setRoleIndex(i => (i + 1) % ROLES.length);
        } else {
            const speed = isDeleting ? 40 : 70;
            timeout = setTimeout(() => {
                setDisplay(isDeleting
                    ? fullText.slice(0, displayText.length - 1)
                    : fullText.slice(0, displayText.length + 1)
                );
            }, speed);
        }

        return () => clearTimeout(timeout);
    }, [displayText, isDeleting, roleIndex]);

    return (
        <div className="about-page">
            <WarpBackground />
            <SEO
                title="About"
                description="Himank Jain — AI/ML Engineer @Google, focused on LLMs, AI systems, and production ML infrastructure."
                path="/about"
            />
            <div className="about-container">
                <aside className="profile-card">
                    <div className="profile-image-container">
                        <img
                            src={profilePhoto}
                            alt="Himank Jain"
                            className="profile-photo"
                        />
                    </div>
                    <h2 className="profile-name">Himank Jain</h2>
                    <p className="profile-role">
                        <span className="role-text">{displayText}</span>
                        <span className="cursor">|</span>
                    </p>

                    <div className="profile-links">
                        <a href="https://github.com/Himank-J" target="_blank" rel="noopener noreferrer" className="profile-link">
                            <Github size={18} />
                            GitHub
                        </a>
                        <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer" className="profile-link">
                            <Linkedin size={18} />
                            LinkedIn
                        </a>
                        <a href="mailto:himankvjain@gmail.com" className="profile-link">
                            <Mail size={18} />
                            Email
                        </a>
                    </div>
                </aside>

                <main className="bio-section">
                    <h1 className="page-title">About Me</h1>

                    <div className="bio-content">
                        <p>
                            I'm an AI/ML Engineer with a passion for building intelligent systems
                            that solve real-world problems. My focus areas include Large Language Models,
                            RAG systems, and production ML infrastructure.
                        </p>
                        <p>
                            I enjoy writing about my experiences and sharing knowledge through technical
                            blog posts on Medium. When I'm not coding, you can find me exploring the
                            latest developments in AI research.
                        </p>
                    </div>

                    <section className="skills-section">
                        <h3 className="section-title">Technologies</h3>
                        <div className="skills-grid">
                            {SKILLS.map(({ name, emoji }) => (
                                <span key={name} className="skill-tag">
                                    <span className="skill-emoji">{emoji}</span>
                                    {name}
                                </span>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}

export default About;
