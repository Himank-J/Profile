import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import './Blog.css';

function Blog() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('http://localhost:8000/api/blogs')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch blogs');
                return res.json();
            })
            .then(data => {
                setBlogs(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // Group blogs by month/year
    // Date format is "January 25th, 2026"
    const groupedBlogs = blogs.reduce((acc, blog) => {
        // Parse "January 25th, 2026" -> extract month and year
        const match = blog.date.match(/^(\w+)\s+\d+\w+,\s+(\d+)$/);
        if (match) {
            const [, month, year] = match;
            const key = `${year} ${month}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(blog);
        }
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="blog-page">
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
                <h1 className="page-title">Index</h1>
                <p className="error-message">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="blog-page">
            <h1 className="page-title">Index</h1>

            {Object.entries(groupedBlogs).map(([period, periodBlogs]) => (
                <section key={period} className="blog-section">
                    <h2 className="period-title">{period}</h2>

                    <div className="blog-grid">
                        {periodBlogs.map((blog, index) => (
                            <article
                                key={blog.link}
                                className="blog-row"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="blog-date-col">
                                    <span className="blog-date">{blog.date}</span>
                                </div>

                                <div className="blog-content-col">
                                    <a href={blog.link} target="_blank" rel="noopener noreferrer" className="blog-link">
                                        <h3 className="blog-title">
                                            {blog.title}
                                            <ExternalLink size={14} className="external-icon" />
                                        </h3>
                                    </a>
                                    {blog.tags && blog.tags.length > 0 && (
                                        <div className="blog-tags">
                                            {blog.tags.map(tag => (
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
