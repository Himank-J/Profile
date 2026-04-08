import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import { getPost } from '../utils/posts';
import SEO from '../components/SEO';
import config from '../config';
import './BlogPost.css';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, ''); // e.g. "/Profile" or ""

// Prepend base to /uploads/... relative paths; leave absolute URLs alone
function resolveImg(src) {
    if (!src) return src;
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    // src from posts.json is already rewritten to /uploads/...
    return `${BASE}${src}`;
}

function getText(node) {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(getText).join('');
    if (node && node.props && node.props.children) return getText(node.props.children);
    return '';
}

// Custom renderers for ReactMarkdown
const mdComponents = {
    img({ src, alt, ...props }) {
        return <img src={resolveImg(src)} alt={alt} loading="lazy" {...props} />;
    },
    h2({ children, ...props }) {
        const text = getText(children);
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        return <h2 id={id} {...props}>{children}</h2>;
    },
    h3({ children, ...props }) {
        const text = getText(children);
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        return <h3 id={id} {...props}>{children}</h3>;
    }
};

function BlogPost() {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toc, setToc] = useState([]);
    const [activeId, setActiveId] = useState('');
    const [readingTime, setReadingTime] = useState(0);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getPost(slug)
            .then(p => {
                if (!p) throw new Error('Post not found');
                setPost(p);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [slug]);

    useEffect(() => {
        if (!post) return;

        // Reading time
        const words = post.body.trim().split(/\s+/).length;
        setReadingTime(Math.ceil(words / 200));

        // TOC
        const headings = [];
        const lines = post.body.split('\n');
        for (const line of lines) {
            const match = line.match(/^(#{2,3})\s+(.+)$/);
            if (match) {
                const level = match[1].length;
                const title = match[2];
                const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                headings.push({ title, id, level });
            }
        }
        setToc(headings);
    }, [post]);

    useEffect(() => {
        if (!post || toc.length === 0) return;

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '0% 0% -80% 0%' }
        );

        toc.forEach(item => {
            const element = document.getElementById(item.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [post, toc]);

    // ── Scroll depth + Reading time tracking ──────────────────────────────
    useEffect(() => {
        if (!post) return;
        const startTime = Date.now();
        const fired = new Set();
        const MILESTONES = [25, 50, 75, 100];

        function onScroll() {
            const el = document.documentElement;
            const scrolled = el.scrollTop + el.clientHeight;
            const total = el.scrollHeight;
            const pct = Math.round((scrolled / total) * 100);
            MILESTONES.forEach(m => {
                if (pct >= m && !fired.has(m)) {
                    fired.add(m);
                    if (typeof window.gtag === 'function') {
                        window.gtag('event', 'scroll_depth', {
                            post_slug: post.slug,
                            post_title: post.title,
                            depth_percent: m,
                        });
                    }
                }
            });
        }

        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);
            const seconds = Math.round((Date.now() - startTime) / 1000);
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'reading_time', {
                    post_slug: post.slug,
                    post_title: post.title,
                    seconds_spent: seconds,
                });
            }
        };
    }, [post]);

    if (loading) {
        return (
            <div className="blog-post-page">
                <p className="post-loading">Loading…</p>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="blog-post-page">
                <Link to="/" className="back-link">
                    <ArrowLeft size={16} /> Back to Index
                </Link>
                <div className="post-error">
                    <h2>Post not found</h2>
                    <p>This post may have been moved or deleted.</p>
                </div>
            </div>
        );
    }

    // JSON-LD structured data for Google rich results
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        author: {
            '@type': 'Person',
            name: 'Himank Jain',
            url: config.SITE_URL,
        },
        ...(post.image && { image: post.image }),
        url: `${config.SITE_URL}/#/blog/${post.slug}`,
    };

    return (
        <div className="blog-post-page">
            <SEO
                title={post.title}
                description={post.description}
                image={post.image}
                path={`/blog/${post.slug}`}
                type="article"
                publishedAt={post.date}
            />

            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="blog-post-layout">
                <div className="blog-post-left">
                    <Link to="/" className="back-link">
                        <ArrowLeft size={16} /> Back
                    </Link>
                    <div className="post-sidebar-meta">
                        <div className="post-sidebar-date">{post.displayDate || post.date}</div>
                        <div className="post-reading-time">{readingTime} min read</div>
                    </div>
                </div>

                <div className="blog-post-center">
                    <header className="post-header">
                        <h1 className="post-title">{post.title}</h1>
                        {post.tags?.length > 0 && (
                            <div className="post-tags">
                                {post.tags.map(tag => (
                                    <span key={tag} className="tag">{tag}</span>
                                ))}
                            </div>
                        )}
                    </header>

                    {post.image && (
                        <img
                            className="post-cover"
                            src={resolveImg(post.image)}
                            alt={post.title}
                            loading="lazy"
                        />
                    )}

                    <div className="post-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                            {post.body}
                        </ReactMarkdown>
                    </div>
                </div>

                <div className="blog-post-right">
                    {toc.length > 0 && (
                        <nav className="post-toc">
                            <h3>Index</h3>
                            <ul>
                                {toc.map(item => (
                                    <li 
                                        key={item.id} 
                                        className={`toc-level-${item.level} ${activeId === item.id ? 'active' : ''}`}
                                    >
                                        <a 
                                            href={`#${item.id}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                        >
                                            {item.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BlogPost;
