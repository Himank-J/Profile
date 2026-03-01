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

// Custom img renderer for ReactMarkdown
const mdComponents = {
    img({ src, alt, ...props }) {
        return <img src={resolveImg(src)} alt={alt} loading="lazy" {...props} />;
    },
};

function BlogPost() {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

            <Link to="/" className="back-link">
                <ArrowLeft size={16} /> Back to Index
            </Link>

            <header className="post-header">
                <h1 className="post-title">{post.title}</h1>
                <div className="post-meta">
                    <span>{post.displayDate || post.date}</span>
                    {post.tags?.length > 0 && (
                        <div className="post-tags">
                            {post.tags.map(tag => (
                                <span key={tag} className="tag">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
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
    );
}

export default BlogPost;
