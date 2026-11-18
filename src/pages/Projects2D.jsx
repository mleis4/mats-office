/*
 * ============================================================================
 * Program Name:   Projects2D.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 17, 2026
 * Description:    The plain 2D engineering portfolio: a home page (featured
 *                 work, other projects, skills, contact) and one write-up
 *                 page per project. It reads the same JSON as the 3D office.
 *                 It is the "skip" option for people in a hurry and the
 *                 fallback when WebGL is not available.
 *
 *                 Routes live in the hash, because the site is static:
 *                   #2d            home page
 *                   #2d/<id>       write-up for one project
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import { CONTACT, ITEMS_BY_ID } from '../data/catalog';
import portfolio from '../data/portfolio.json';
import { Lightbox } from '../ui/ProjectCard';
import BoardStackViewer from './BoardStackViewer';
import Skip2DButton from '../ui/Skip2DButton';

const PROJECT_ROUTE_PATTERN = /^#2d\/(.+)$/;

const FEATURED_PROJECTS = portfolio.featured.map((projectId) => ITEMS_BY_ID[projectId]).filter(Boolean);
const OTHER_PROJECTS = portfolio.projects.map((projectId) => ITEMS_BY_ID[projectId]).filter(Boolean);
const ALL_PROJECTS = [...FEATURED_PROJECTS, ...OTHER_PROJECTS];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readProjectIdFromHash() {
  const match = window.location.hash.match(PROJECT_ROUTE_PATTERN);
  return match ? decodeURIComponent(match[1]) : null;
}

const projectHref = (projectId) => `#2d/${encodeURIComponent(projectId)}`;

// Some image file names have spaces or brackets in them
const imageSrc = (imageUrl) => encodeURI(imageUrl);

function scrollToSection(sectionId) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------
function SiteNav({ canUse3D, isHome }) {
  return (
    <header className="pf-nav">
      <div className="pf-container pf-nav-inner">
        <a className="pf-brand" href="#2d">{CONTACT.name}</a>
        <nav className="pf-nav-links" aria-label="Main">
          {isHome ? (
            <>
              <button type="button" onClick={() => scrollToSection('work')}>Work</button>
              <button type="button" onClick={() => scrollToSection('projects')}>Projects</button>
              <button type="button" onClick={() => scrollToSection('skills')}>Skills</button>
              <button type="button" onClick={() => scrollToSection('contact')}>Contact</button>
            </>
          ) : (
            <a href="#2d">All work</a>
          )}
          <a href={CONTACT.resumeUrl} target="_blank" rel="noreferrer">Resume</a>
          {canUse3D && <Skip2DButton is2D />}
        </nav>
      </div>
    </header>
  );
}

function SectionHead({ copy, headingId }) {
  return (
    <div className="pf-section-head">
      <span className="pf-eyebrow">{copy.eyebrow}</span>
      <h2 id={headingId}>{copy.heading}</h2>
      {copy.intro && <p>{copy.intro}</p>}
    </div>
  );
}

function Tags({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="pf-tags">
      {items.map((tag) => <li key={tag}>{tag}</li>)}
    </ul>
  );
}

function Thumb({ project, isEager = false }) {
  const thumbUrl = project.images?.[0];
  return (
    <figure className="pf-thumb">
      {thumbUrl && (
        <img src={imageSrc(thumbUrl)} alt="" loading={isEager ? 'eager' : 'lazy'} decoding="async" />
      )}
    </figure>
  );
}

function SiteFooter() {
  return (
    <footer className="pf-footer">
      <div className="pf-container pf-footer-inner">
        <p>© {new Date().getFullYear()} {CONTACT.name}</p>
        <nav className="pf-footer-links" aria-label="Footer">
          <a href={`mailto:${CONTACT.email}`}>Email</a>
          <a href={CONTACT.github} target="_blank" rel="noreferrer">GitHub</a>
          <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={CONTACT.resumeUrl} target="_blank" rel="noreferrer">Resume</a>
        </nav>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------
function FeatureCard({ project }) {
  return (
    <article className="pf-feature">
      <a className="pf-feature-thumb" href={projectHref(project.id)} tabIndex={-1} aria-hidden="true">
        <Thumb project={project} />
      </a>
      <div className="pf-feature-body">
        <p className="pf-meta">{project.cardMeta ?? project.dates}</p>
        <h3><a href={projectHref(project.id)}>{project.name}</a></h3>
        <p>{project.blurb ?? project.pitch}</p>
        <Tags items={project.tech.slice(0, 6)} />
        <a className="pf-more" href={projectHref(project.id)}>Read the write-up →</a>
      </div>
    </article>
  );
}

function GridCard({ project }) {
  return (
    <article className="pf-card">
      <a href={projectHref(project.id)} tabIndex={-1} aria-hidden="true">
        <Thumb project={project} />
      </a>
      <div className="pf-card-body">
        <p className="pf-meta">{project.cardMeta ?? project.dates}</p>
        <h3><a href={projectHref(project.id)}>{project.name}</a></h3>
        <p>{project.blurb ?? project.pitch}</p>
        <a className="pf-more" href={projectHref(project.id)}>Read more →</a>
      </div>
    </article>
  );
}

function HomePage({ canUse3D }) {
  const { sections } = portfolio;

  return (
    <main id="main">
      {!canUse3D && (
        <div className="pf-container">
          <p className="pf-notice">Your browser can't show the 3D office, so here is everything on one page.</p>
        </div>
      )}

      {/* ---- Hero ---- */}
      <section className="pf-hero" aria-labelledby="hero-title">
        <div className="pf-container pf-hero-grid">
          <div>
            <h1 id="hero-title">{CONTACT.name}</h1>
            <p className="pf-hero-lede">{portfolio.heroLede}</p>
            <div className="pf-actions">
              <button type="button" className="pf-button pf-button-primary" onClick={() => scrollToSection('work')}>See my work</button>
              <a className="pf-button" href={CONTACT.resumeUrl} target="_blank" rel="noreferrer">Resume (PDF)</a>
              <a className="pf-button" href={CONTACT.github} target="_blank" rel="noreferrer">GitHub</a>
              <a className="pf-button" href={CONTACT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            </div>
          </div>
          <img className="pf-headshot" src="/images/headshot-web.jpg" alt="Portrait of Mats Leis" fetchPriority="high" />
        </div>
      </section>

      {/* ---- Featured work ---- */}
      <section className="pf-section pf-section-surface" id="work" aria-labelledby="work-title">
        <div className="pf-container">
          <SectionHead copy={sections.work} headingId="work-title" />
          <div className="pf-featured">
            {FEATURED_PROJECTS.map((project) => <FeatureCard key={project.id} project={project} />)}
          </div>
        </div>
      </section>

      {/* ---- Other projects ---- */}
      <section className="pf-section" id="projects" aria-labelledby="projects-title">
        <div className="pf-container">
          <SectionHead copy={sections.projects} headingId="projects-title" />
          <div className="pf-grid">
            {OTHER_PROJECTS.map((project) => <GridCard key={project.id} project={project} />)}
          </div>
        </div>
      </section>

      {/* ---- Skills ---- */}
      <section className="pf-section pf-section-surface" id="skills" aria-labelledby="skills-title">
        <div className="pf-container">
          <SectionHead copy={sections.skills} headingId="skills-title" />
          <div className="pf-skills">
            {portfolio.skills.map((skillGroup) => (
              <div key={skillGroup.group}>
                <h3>{skillGroup.group}</h3>
                <ul>
                  {skillGroup.items.map((skill) => <li key={skill}>{skill}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Contact ---- */}
      <section className="pf-section pf-contact" id="contact" aria-labelledby="contact-title">
        <div className="pf-container">
          <span className="pf-eyebrow">{sections.contact.eyebrow}</span>
          <h2 id="contact-title">{sections.contact.heading}</h2>
          <p>{sections.contact.intro}</p>
          <a className="pf-contact-mail" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          <div className="pf-actions pf-actions-centre">
            <a className="pf-button pf-button-primary" href={`mailto:${CONTACT.email}`}>Email me</a>
            <a className="pf-button pf-button-on-dark" href={CONTACT.resumeUrl} target="_blank" rel="noreferrer">Download resume</a>
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Project write-up page
// ---------------------------------------------------------------------------
function ProjectPage({ project, onOpenImage, canUse3D }) {
  const titleRef = useRef(null);
  const projectIndex = ALL_PROJECTS.findIndex((candidate) => candidate.id === project.id);
  const nextProject = ALL_PROJECTS[(projectIndex + 1) % ALL_PROJECTS.length];

  // A project with a 3D viewer shows it in place of the lead image, and its
  // images move down to the gallery. Without WebGL the image leads as usual.
  const hasViewer = Boolean(project.viewer) && canUse3D;
  const projectImages = project.images ?? [];
  const heroImage = hasViewer ? null : projectImages[0];
  const galleryImages = hasViewer ? projectImages : projectImages.slice(1);

  // Move keyboard and screen-reader focus to the new page's title
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [project.id]);

  return (
    <main id="main" className="pf-article">
      <div className="pf-container pf-article-inner">
        <a className="pf-back" href="#2d">← All work</a>

        <header className="pf-article-head">
          <span className="pf-eyebrow">{project.kind}</span>
          <h1 ref={titleRef} tabIndex={-1}>{project.name}</h1>
          <p className="pf-lede">{project.lede ?? project.pitch}</p>
        </header>

        <dl className="pf-facts">
          {project.role && (<div><dt>Role</dt><dd>{project.role}</dd></div>)}
          {project.dates && (<div><dt>When</dt><dd>{project.dates}</dd></div>)}
          {project.tech?.length > 0 && (<div className="pf-facts-wide"><dt>Built with</dt><dd><Tags items={project.tech} /></dd></div>)}
        </dl>

        {heroImage && (
          <button type="button" className="pf-hero-image" onClick={() => onOpenImage(heroImage)} aria-label="Enlarge image">
            <img src={imageSrc(heroImage)} alt="" />
          </button>
        )}

        {hasViewer && <BoardStackViewer copy={project.viewer} />}

        <div className="pf-prose">
          {project.writeup?.length ? (
            project.writeup.map((block) => (
              <section key={block.heading}>
                <h2>{block.heading}</h2>
                {block.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {block.bullets && (
                  <ul>
                    {block.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                )}
              </section>
            ))
          ) : (
            <p>{project.summary}</p>
          )}

          {project.results?.length > 0 && (
            <section>
              <h2>Results</h2>
              <ul>
                {project.results.map((result) => <li key={result}>{result}</li>)}
              </ul>
            </section>
          )}

          {project.takeaway && <blockquote>{project.takeaway}</blockquote>}
          {project.credit && <p className="pf-credit">{project.credit}</p>}
        </div>

        {galleryImages.length > 0 && (
          <div className="pf-gallery">
            {galleryImages.map((imageUrl) => (
              <button key={imageUrl} type="button" onClick={() => onOpenImage(imageUrl)} aria-label="Enlarge image">
                <img src={imageSrc(imageUrl)} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}

        {project.links?.length > 0 && (
          <div className="pf-actions">
            {project.links.map((link) => (
              <a key={link.url} className="pf-button pf-button-primary" href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
            ))}
          </div>
        )}

        {nextProject && nextProject.id !== project.id && (
          <a className="pf-next" href={projectHref(nextProject.id)}>
            <span>Next project</span>
            {nextProject.name} →
          </a>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Projects2D
// ---------------------------------------------------------------------------
export default function Projects2D({ canUse3D }) {
  const [projectId, setProjectId] = useState(readProjectIdFromHash);
  const [enlargedImage, setEnlargedImage] = useState(null);

  // Follow the hash between the home page and the write-ups
  useEffect(() => {
    const syncWithHash = () => {
      setProjectId(readProjectIdFromHash());
      setEnlargedImage(null);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', syncWithHash);
    return () => window.removeEventListener('hashchange', syncWithHash);
  }, []);

  // An unknown id (old link, typo) falls back to the home page
  const project = projectId && ALL_PROJECTS.some((candidate) => candidate.id === projectId)
    ? ITEMS_BY_ID[projectId]
    : null;

  // The tab title names the page, and goes back when leaving the 2D view
  useEffect(() => {
    const previousTitle = document.title;
    document.title = project ? `${project.name} · ${CONTACT.name}` : portfolio.documentTitle;
    return () => { document.title = previousTitle; };
  }, [project]);

  return (
    <div className="page-2d">
      <SiteNav canUse3D={canUse3D} isHome={!project} />
      {project
        ? <ProjectPage project={project} onOpenImage={setEnlargedImage} canUse3D={canUse3D} />
        : <HomePage canUse3D={canUse3D} />}
      <SiteFooter />
      <Lightbox imageUrl={enlargedImage} onClose={() => setEnlargedImage(null)} />
    </div>
  );
}
