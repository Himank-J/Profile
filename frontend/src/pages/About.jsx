import { useEffect, useState } from 'react';
import { Github, Linkedin, Mail, Twitter } from 'lucide-react';
import SEO from '../components/SEO';
import WarpBackground from '../components/WarpBackground';
import profilePhoto from '/profile-photo.jpg';
import './About.css';

const ROLES = [
    'AI/ML Engineer @Google',
    'LLM/NLP Practitioner',
    'Building Scalable AI Systems',
    'Applied AI Educator',
];

const TECH_STACK = [
    {
        emoji: '💻',
        category: 'Programming',
        items: ['Python', 'Java', 'Kotlin'],
    },
    {
        emoji: '🧠',
        category: 'Machine Learning & AI',
        items: [
            'Predictive Modeling', 'Feature Engineering',
            'Transformer Models', 'LLMs', 'Embeddings', 'RAG systems',
            'Deep Learning', 'NLP', 'Anomaly Detection', 'Graph-based methods', 'Object Detection'
        ],
    },
    {
        emoji: '🧱',
        category: 'Architecture & System Design',
        items: [
            'Event-driven Microservices', 'Large-scale Data Processing',
            'MLOps', 'CI/CD', 'Containerized AI Workloads',
        ],
    },
    {
        emoji: '⚙️',
        category: 'Tools & Frameworks',
        items: [
            'PyTorch', 'TensorFlow', 'Scikit-learn',
            'FastAPI', 'LangChain', 'LangGraph',
            'Docker', 'Kubernetes', 'ArgoCD',
            'Kafka', 'GitHub Actions'
        ],
    },
    {
        emoji: '🗄️',
        category: 'Databases & Search',
        items: ['Elasticsearch', 'MongoDB', 'SQL'],
    },
    {
        emoji: '☁️',
        category: 'Cloud',
        items: ['Azure', 'AWS'],
    },
];

function About() {
    const [roleIndex, setRoleIndex] = useState(0);
    const [displayText, setDisplay] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fullText = ROLES[roleIndex];
        let timeout;
        if (!isDeleting && displayText === fullText) {
            timeout = setTimeout(() => setIsDeleting(true), 1800);
        } else if (isDeleting && displayText === '') {
            setIsDeleting(false);
            setRoleIndex(i => (i + 1) % ROLES.length);
        } else {
            timeout = setTimeout(() => {
                setDisplay(isDeleting
                    ? fullText.slice(0, displayText.length - 1)
                    : fullText.slice(0, displayText.length + 1)
                );
            }, isDeleting ? 40 : 70);
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
                {/* ── Profile sidebar ──────────────────────────────────── */}
                <aside className="profile-card">
                    <div className="profile-image-container">
                        <img src={profilePhoto} alt="Himank Jain" className="profile-photo" />
                    </div>
                    <h2 className="profile-name">Himank Jain</h2>
                    <p className="profile-role">
                        <span className="role-text">{displayText}</span>
                        <span className="cursor">|</span>
                    </p>
                    <div className="profile-links">
                        <a href="https://github.com/Himank-J" target="_blank" rel="noopener noreferrer" className="profile-link">
                            <Github size={18} /> GitHub
                        </a>
                        <a href="https://linkedin.com/in/himank-jain" target="_blank" rel="noopener noreferrer" className="profile-link">
                            <Linkedin size={18} /> LinkedIn
                        </a>
                        <a href="https://x.com/HimankJain85627" target="_blank" rel="noopener noreferrer" className="profile-link">
                            <Twitter size={18} /> X / Twitter
                        </a>
                        <a href="https://mail.google.com/mail/?view=cm&to=himankvjain@gmail.com" target="_blank" rel="noopener noreferrer" className="profile-link">
                            <Mail size={18} /> Email
                        </a>
                    </div>
                </aside>

                {/* ── Bio + Tech Stack ─────────────────────────────────── */}
                <main className="bio-section">
                    <h1 className="page-title">About Me</h1>

                    <div className="bio-content">
                        <p>
                            Hello, I'm Himank Jain.
                        </p>
                        <p>
                            I'm currently an <strong>SDE-III (AI/ML Engineer) at Google</strong>, where I work on making
                            payments seamless for genuine users and extremely difficult for fraudsters. My work focuses
                            on building large-scale, production-grade AI systems that balance security, trust, and user experience.
                        </p>
                        <p>
                            I strongly believe in <strong>purposeful AI</strong> — leveraging data responsibly and applying
                            state-of-the-art AI techniques to create meaningful, measurable impact.
                        </p>
                        <p>
                            Before joining Google in 2025, I was a <strong>Senior Data Scientist at Bajaj Finserv Health</strong>,
                            where I led the development of <strong>Enigma AI</strong> — an AI-driven platform for intelligent
                            claims processing and fraud &amp; abuse detection.
                        </p>
                        <p>
                            At Bajaj Finserv Health, I played a key role in building Enigma from the ground up and served as
                            the <strong>Technical/Engineering Lead</strong> for the platform. Under my leadership, the system
                            delivered significant business outcomes:
                        </p>
                        <ul className="bio-highlights">
                            <li><span className="highlight-stat">~25%</span> of claims were fully auto-paid (zero human intervention)</li>
                            <li><span className="highlight-stat">50%</span> increase in human productivity</li>
                            <li><span className="highlight-stat">~₹30M+</span> in verified savings through fraud and abuse detection</li>
                        </ul>
                        <p>I designed and led solutions across the entire claims lifecycle, highlighting some key builds:</p>
                        <ul className="bio-list">
                            <li>Document classification and structured data extraction for claims processing</li>
                            <li>Duplicate document detection for Fraud Detection</li>
                            <li>Medical abuse analysis for Abuse Detection</li>
                            <li>Graph-based fraud ring detection for Fraud Detection</li>
                        </ul>
                        <p>
                            My approach consistently combined <strong>classical machine learning, deep learning, and advanced
                                AI/LLM-based systems to build scalable, high-impact AI solutions</strong>.
                        </p>
                        <p>
                            Beyond engineering, I collaborated closely with Product and Sales teams to position and pitch Enigma
                            to leading insurers, including Star Health Insurance, Niva Bupa, ICICI Prudential, SBI, as well as
                            international players such as Sumitomo Life and Zurich Insurance.
                        </p>
                        <p>
                            I actively share my knowledge through research, blog posts, and on{' '}
                            <a href="https://linkedin.com/in/himank-jain" target="_blank" rel="noopener noreferrer" className="bio-link">LinkedIn</a>
                            {' '}and{' '}
                            <a href="https://x.com/HimankJain85627" target="_blank" rel="noopener noreferrer" className="bio-link">X (formerly Twitter)</a>.
                            On my blog, I break down complex AI concepts, share practical tutorials, and provide insights into
                            the latest advancements in the field, a practice I continue to this day.
                        </p>
                    </div>

                    {/* ── Tech Stack ───────────────────────────────────── */}
                    <section className="tech-section">
                        <h2 className="tech-section-heading">Technology that enables me to deliver impact</h2>
                        <div className="tech-grid">
                            {TECH_STACK.map(({ emoji, category, items }) => (
                                <div key={category} className="tech-card">
                                    <div className="tech-card-header">
                                        <span className="tech-emoji">{emoji}</span>
                                        <span className="tech-category">{category}</span>
                                    </div>
                                    <div className="tech-items">
                                        {items.map(item => (
                                            <span key={item} className="tech-badge">{item}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}

export default About;
