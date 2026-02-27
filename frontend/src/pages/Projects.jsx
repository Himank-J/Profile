import { useState, useMemo } from 'react';
import { Star, ExternalLink, ArrowUpDown, Filter } from 'lucide-react';
import SEO from '../components/SEO';
import './Projects.css';

// Language dot colors
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

const SORT_OPTIONS = [
    { value: 'updated_desc', label: 'Recently Updated' },
    { value: 'created_desc', label: 'Newest First' },
    { value: 'created_asc', label: 'Oldest First' },
    { value: 'stars_desc', label: 'Most Stars' },
];

function ProjectCard({ project, index }) {
    return (
        <article
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
                            style={{ backgroundColor: languageColors[project.language] || '#888' }}
                        />
                        {project.language}
                    </span>
                )}
                {project.stars > 0 && (
                    <span className="stars">
                        <Star size={13} />
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
                <ExternalLink size={13} />
            </a>
        </article>
    );
}

function Projects({ projects, loading, error }) {
    // ── State ──────────────────────────────────────────────────────────────
    const [sortBy, setSortBy] = useState('updated_desc');
    const [onlyStarred, setOnlyStarred] = useState(true);   // default: starred only
    const [langFilter, setLangFilter] = useState('all');

    // ── Derive available languages from data ───────────────────────────────
    const languages = useMemo(() => {
        const langs = [...new Set(projects.map(p => p.language).filter(Boolean))].sort();
        return langs;
    }, [projects]);

    // ── Apply filter + sort ────────────────────────────────────────────────
    const displayed = useMemo(() => {
        let list = [...projects];

        // Filter: language only (starred is a sort-to-top, not a hard filter)
        if (langFilter !== 'all') list = list.filter(p => p.language === langFilter);

        // Sort
        list.sort((a, b) => {
            const ts = iso => iso ? new Date(iso).getTime() : 0;

            // When starred toggle is on, float starred repos above non-starred first
            if (onlyStarred) {
                const aStarred = (a.stars || 0) > 0 ? 0 : 1;
                const bStarred = (b.stars || 0) > 0 ? 0 : 1;
                if (aStarred !== bStarred) return aStarred - bStarred;
            }

            // Primary sort
            let diff = 0;
            switch (sortBy) {
                case 'updated_desc': diff = ts(b.updated_at) - ts(a.updated_at); break;
                case 'created_desc': diff = ts(b.created_at) - ts(a.created_at); break;
                case 'created_asc': diff = ts(a.created_at) - ts(b.created_at); break;
                case 'stars_desc': diff = (b.stars || 0) - (a.stars || 0); break;
                default: diff = 0;
            }

            // Tiebreak by stars desc
            return diff !== 0 ? diff : (b.stars || 0) - (a.stars || 0);
        });

        return list;
    }, [projects, onlyStarred, langFilter, sortBy]);

    // ── Loading skeleton ───────────────────────────────────────────────────
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

            {/* ── Controls bar ───────────────────────────────────────────── */}
            <div className="projects-controls">
                {/* Left: filters */}
                <div className="controls-filters">
                    {/* Starred toggle */}
                    <button
                        className={`filter-chip ${onlyStarred ? 'filter-chip--active' : ''}`}
                        onClick={() => setOnlyStarred(v => !v)}
                    >
                        <Star size={13} />
                        Starred First
                    </button>

                    {/* Language pills */}
                    <button
                        className={`filter-chip ${langFilter === 'all' ? 'filter-chip--active' : ''}`}
                        onClick={() => setLangFilter('all')}
                    >
                        All Languages
                    </button>
                    {languages.map(lang => (
                        <button
                            key={lang}
                            className={`filter-chip ${langFilter === lang ? 'filter-chip--active' : ''}`}
                            onClick={() => setLangFilter(lang)}
                        >
                            <span
                                className="filter-lang-dot"
                                style={{ backgroundColor: languageColors[lang] || '#888' }}
                            />
                            {lang}
                        </button>
                    ))}
                </div>

                {/* Right: sort */}
                <div className="controls-sort">
                    <ArrowUpDown size={14} className="sort-icon" />
                    <select
                        className="sort-select"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Result count ───────────────────────────────────────────── */}
            <p className="projects-count">
                {displayed.length} {displayed.length === 1 ? 'project' : 'projects'}
            </p>

            {/* ── Grid ───────────────────────────────────────────────────── */}
            {displayed.length === 0 ? (
                <div className="projects-empty">
                    <Filter size={32} />
                    <p>No projects match the current filters.</p>
                    <button className="btn-reset" onClick={() => { setOnlyStarred(false); setLangFilter('all'); }}>
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="projects-grid">
                    {displayed.map((project, index) => (
                        <ProjectCard key={project.link} project={project} index={index} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Projects;
