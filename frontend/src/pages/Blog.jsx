import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import SEO from '../components/SEO';
import './Blog.css';

/**
 * Normalise a post date string to a JS Date for sorting.
 * Handles both ISO dates ("2026-02-20") and display strings ("February 20th, 2026").
 */
function toDate(dateStr) {
    if (!dateStr) return new Date(0);
    const d = new Date(dateStr);
    if (!isNaN(d)) return d;
    // Fallback: try stripping ordinal suffix ("20th" → "20")
    return new Date(dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1'));
}

/**
 * Extract month/year key from a date string for grouping.
 * Handles ISO ("2026-02-20") → "2026 February"
 * and display strings ("February 20th, 2026") → "2026 February"
 */
function periodKey(dateStr) {
    // Display format: "February 20th, 2026"
    const displayMatch = dateStr.match(/^(\w+)\s+\d+\w+,\s+(\d+)$/);
    if (displayMatch) return `${displayMatch[2]} ${displayMatch[1]}`;

    // ISO format: "2026-02-20"
    const d = new Date(dateStr);
    if (!isNaN(d)) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${d.getUTCFullYear()} ${months[d.getUTCMonth()]}`;
    }
    return dateStr;
}

function Blog({ blogs, customPosts, loading, error }) {
    // Merge Medium blogs + custom posts into a single sorted array
    const allPosts = [
        ...blogs,
        // Add displayDate and a flag to distinguish custom posts
        ...customPosts.map(p => ({
            ...p,
            date: p.displayDate || p.date,
            _isCustom: true,
        })),
    ].sort((a, b) => toDate(b.date) - toDate(a.date));

    // Group by "YYYY Month" period
    const groupedBlogs = allPosts.reduce((acc, post) => {
        const key = periodKey(post.date);
        if (!acc[key]) acc[key] = [];
        acc[key].push(post);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="blog-page">
                <SEO
                    title="Writing"
                    description="Articles on AI, LLMs, and systems by Himank Jain."
                />
                <h1 className="page-title">Index</h1>
                <div className="skeleton-container">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton-row">
                            <div className="skeleton-date"></div>
                            <div className="skeleton-title"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="blog-page">
                <SEO title="Writing" description="Articles on AI, LLMs, and systems by Himank Jain." />
                <h1 className="page-title">Index</h1>
                <p className="error-message">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="blog-page">
            <SEO
                title="Writing"
                description="Articles on AI, LLMs, and systems by Himank Jain."
            />
            <h1 className="page-title">Index</h1>

            {Object.entries(groupedBlogs).map(([period, periodPosts]) => (
                <section key={period} className="blog-section">
                    <h2 className="period-title">{period}</h2>

                    <div className="blog-grid">
                        {periodPosts.map((post, index) => (
                            <article
                                key={post._isCustom ? post.slug : post.link}
                                className="blog-row"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="blog-date-col">
                                    <span className="blog-date">{post.date}</span>
                                </div>

                                <div className="blog-content-col">
                                    {post._isCustom ? (
                                        // Custom post → internal hash route
                                        <Link
                                            to={`/blog/${post.slug}`}
                                            className="blog-link"
                                            onClick={() => {
                                                if (typeof window.gtag === 'function') {
                                                    window.gtag('event', 'blog_post_click', {
                                                        post_title: post.title,
                                                        post_slug: post.slug,
                                                        post_type: 'custom',
                                                    });
                                                }
                                            }}
                                        >
                                            <h3 className="blog-title">{post.title}</h3>
                                        </Link>
                                    ) : (
                                        // Medium post → external link
                                        <a
                                            href={post.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="blog-link"
                                            onClick={() => {
                                                if (typeof window.gtag === 'function') {
                                                    window.gtag('event', 'blog_post_click', {
                                                        post_title: post.title,
                                                        post_url: post.link,
                                                        post_type: 'medium',
                                                    });
                                                }
                                            }}
                                        >
                                            <h3 className="blog-title">
                                                {post.title}
                                                <ExternalLink size={14} className="external-icon" />
                                            </h3>
                                        </a>
                                    )}

                                    {post.tags?.length > 0 && (
                                        <div className="blog-tags">
                                            {post.tags.map(tag => (
                                                <span key={tag} className="tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

export default Blog;
