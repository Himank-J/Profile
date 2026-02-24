import { Star, ExternalLink } from 'lucide-react';
import SEO from '../components/SEO';
import './Projects.css';

// Language colors for badges
const languageColors = {
    Python: '#3572A5',
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    Java: '#b07219',
    Go: '#00ADD8',
    Rust: '#dea584',
    C: '#555555',
    'C++': '#f34b7d',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Jupyter: '#DA5B0B',
    Shell: '#89e051',
};

function Projects({ projects, loading, error }) {
    if (loading) {
        return (
            <div className="projects-page">
                <SEO title="Projects" description="Open source contributions and personal projects by Himank Jain." />
                <h1 className="page-title">Projects</h1>
                <p className="page-subtitle">Open source contributions and personal projects</p>
                <div className="projects-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton-card">
                            <div className="skeleton-card-title"></div>
                            <div className="skeleton-card-desc"></div>
                            <div className="skeleton-card-meta"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="projects-page">
                <SEO title="Projects" description="Open source contributions and personal projects by Himank Jain." />
                <h1 className="page-title">Projects</h1>
                <p className="error-message">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="projects-page">
            <SEO title="Projects" description="Open source contributions and personal projects by Himank Jain." />
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">Open source contributions and personal projects</p>

            <div className="projects-grid">
                {projects.map((project, index) => (
                    <article
                        key={project.link}
                        className="project-card"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <h3 className="project-title">{project.title}</h3>
                        <p className="project-description">{project.description || 'No description available'}</p>

                        <div className="project-meta">
                            {project.language && (
                                <span className="language-badge">
                                    <span
                                        className="language-dot"
                                        style={{ backgroundColor: languageColors[project.language] || '#666' }}
                                    />
                                    {project.language}
                                </span>
                            )}
                            {project.stars > 0 && (
                                <span className="stars">
                                    <Star size={14} />
                                    {project.stars}
                                </span>
                            )}
                            <span className="project-date">{project.date}</span>
                        </div>

                        <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-link"
                        >
                            View on GitHub
                            <ExternalLink size={14} />
                        </a>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default Projects;
