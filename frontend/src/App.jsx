import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Blog from './pages/Blog';
import Projects from './pages/Projects';
import About from './pages/About';
import config from './config';
import './index.css';

function App() {
  const [blogs, setBlogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [blogsError, setBlogsError] = useState(null);
  const [projectsError, setProjectsError] = useState(null);

  // Fetch once on mount — navigating between tabs won't re-trigger
  useEffect(() => {
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
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Blog blogs={blogs} loading={blogsLoading} error={blogsError} />} />
              <Route path="/projects" element={<Projects projects={projects} loading={projectsLoading} error={projectsError} />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
