import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import MarketingLayout from '../components/marketing/MarketingLayout'

const STYLES = `
.blog-post-hero {
  padding: 32px 0 60px;
}
.blog-post-breadcrumb {
  font-size: 0.8rem;
  color: #b08090;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.blog-post-breadcrumb a { color: #b08090; text-decoration: none; }
.blog-post-breadcrumb a:hover { color: #c2185b; }
.blog-post-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 16px;
}
.blog-post-h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #1a0a10;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
}
.blog-post-meta {
  font-size: 0.85rem;
  color: #b08090;
}
.blog-post-divider { height: 1px; background: rgba(240,96,144,0.12); margin: 0; }
.blog-post-body {
  padding: 60px 0 100px;
}
.blog-coming-card {
  background: #fff;
  border: 1px solid rgba(240,96,144,0.15);
  border-radius: 20px;
  padding: 60px 48px;
  text-align: center;
}
.blog-coming-card h2 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 700;
  color: #1a0a10;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}
.blog-coming-card h2 em { font-style: italic; color: #c2185b; }
.blog-coming-card p {
  font-size: 0.95rem;
  color: #71717a;
  line-height: 1.65;
  max-width: 420px;
  margin: 0 auto 32px;
}
.mkt-btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 14px 32px;
  background: #c2185b;
  color: #fff;
  border-radius: 100px;
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s, transform 0.1s;
}
.mkt-btn-primary:hover { background: #a8124e; transform: translateY(-1px); }
@media (max-width: 600px) {
  .blog-post-hero { padding: 80px 0 40px; }
  .blog-coming-card { padding: 40px 24px; }
}
`

export default function BlogPostPage() {
  const { slug } = useParams()

  const title = slug
    ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Article'

  useEffect(() => {
    document.title = `${title} — PHASR Blog`
  }, [title])

  return (
    <MarketingLayout>
      <style>{STYLES}</style>

      <section className="blog-post-hero">
        <div className="mkt-container-narrow">
          <div className="blog-post-breadcrumb">
            <Link to="/blog">Blog</Link>
            <span>/</span>
            <span>{title}</span>
          </div>
          <span className="blog-post-tag">Coming soon</span>
          <h1 className="blog-post-h1">{title}</h1>
          <p className="blog-post-meta">PHASR · Publishing at launch</p>
        </div>
      </section>

      <div className="blog-post-divider" />

      <section className="blog-post-body">
        <div className="mkt-container-narrow">
          <div className="blog-coming-card">
            <h2>This article is<br /><em>on its way.</em></h2>
            <p>We're publishing this at launch. Join the waitlist and you'll get it in your inbox the day it goes live.</p>
            <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
