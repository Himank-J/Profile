import { HashRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Blog from './pages/Blog';
import Projects from './pages/Projects';
import About from './pages/About';
import BlogPost from './pages/BlogPost';
import config from './config';
import { fetchPosts } from './utils/posts';
import './index.css';

function App() {
  const [blogs, setBlogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [customPosts, setCustomPosts] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [blogsError, setBlogsError] = useState(null);
  const [projectsError, setProjectsError] = useState(null);

  // Fetch all data once on mount — navigating between tabs won't re-trigger
  useEffect(() => {
    // Medium blogs from FastAPI backend
    fetch(`${config.API_BASE_URL}/api/blogs`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch blogs');
        return res.json();
      })
      .then(data => {
        setBlogs(data);
        setBlogsLoading(false);
      })
      .catch(err => {
        setBlogsError(err.message);
        setBlogsLoading(false);
      });

    // GitHub projects from FastAPI backend
    fetch(`${config.API_BASE_URL}/api/projects`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
      })
      .then(data => {
        setProjects(data);
        setProjectsLoading(false);
      })
      .catch(err => {
        setProjectsError(err.message);
        setProjectsLoading(false);
      });

    // Custom posts from static posts.json (baked at build time)
    fetchPosts()
      .then(setCustomPosts)
      .catch(() => setCustomPosts([])); // fail silently — no posts yet is fine
  }, []);

  return (
    <HelmetProvider>
      <ThemeProvider>
        <HashRouter>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route
                  path="/"
                  element={
                    <Blog
                      blogs={blogs}
                      customPosts={customPosts}
                      loading={blogsLoading}
                      error={blogsError}
                    />
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <Projects
                      projects={projects}
                      loading={projectsLoading}
                      error={projectsError}
                    />
                  }
                />
                <Route path="/about" element={<About />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </HashRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
