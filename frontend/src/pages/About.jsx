import { useEffect, useState } from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import SEO from '../components/SEO';
import './About.css';

function About() {
    const [displayText, setDisplayText] = useState('');
    const fullText = 'AI/ML Engineer';

    useEffect(() => {
        let index = 0;
        const timer = setInterval(() => {
            setDisplayText(fullText.slice(0, index + 1));
            index++;
            if (index >= fullText.length) clearInterval(timer);
        }, 100);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="about-page">
            <SEO
                title="About"
                description="Himank Jain — AI/ML Engineer @Google, focused on LLMs, AI systems, and production ML infrastructure."
                path="/about"
            />
            <div className="about-container">
                <aside className="profile-card">
                    <div className="profile-image-container">
                        <div className="profile-image-placeholder">HJ</div>
                    </div>
                    <h2 className="profile-name">Himank Jain</h2>
                    <p className="profile-role">
                        {displayText}
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
                            {['Python', 'PyTorch', 'LangChain', 'FastAPI', 'Docker', 'AWS',
                                'Hugging Face', 'RAG', 'LLMs', 'Vector DBs'].map(skill => (
                                    <span key={skill} className="skill-tag">{skill}</span>
                                ))}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}

export default About;
