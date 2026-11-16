/*
 * ============================================================================
 * Program Name:   ProjectCard.jsx
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    The info window that opens when any object is clicked:
 *                 projects, monitor apps and hobbies all use this one card.
 *                 It shows the description, tech, results, links and a photo
 *                 gallery (click a photo to enlarge it). It is a side panel
 *                 on desktop and a bottom sheet on phones. ItemDetails is
 *                 shared with the 2D page so both show identical content.
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import records from '../data/records.json';

const STATUS_LABELS = {
  live: 'Currently listening',
  recent: 'Last listened to',
  fallback: 'On the platter (from the crate)',
};

// ---------------------------------------------------------------------------
// NowPlayingPlayer: the turntable's music player, laid out like a phone's
// lock-screen player: a big cover in the centre over a blurred copy of itself,
// the song underneath, then a progress bar and playback buttons. The bar and
// buttons are for looks only; Last.fm doesn't say how far into the song I am.
// Below the player: my top artist and top song of the last 30 days.
// ---------------------------------------------------------------------------
function NowPlayingPlayer({ nowPlaying }) {
  const isLive = nowPlaying.status === 'live';
  const artUrl = nowPlaying.artUrl ? encodeURI(nowPlaying.artUrl) : null;
  const { topArtist, topTrack } = nowPlaying;

  return (
    <>
      <div className={isLive ? 'now-playing is-live' : 'now-playing'}>
        {artUrl && <img className="now-playing-backdrop" src={artUrl} alt="" aria-hidden="true" />}

        <span className="now-playing-status">
          <i className="now-playing-dot" aria-hidden="true" />
          {STATUS_LABELS[nowPlaying.status]}
        </span>

        {artUrl
          ? <img className="now-playing-art" src={artUrl} alt={`Cover art for ${nowPlaying.title}`} />
          : <div className="now-playing-art is-blank" aria-hidden="true">♪</div>}

        <div className="now-playing-song">
          <span className="now-playing-title">{nowPlaying.title}</span>
          <span className="now-playing-artist">{nowPlaying.artist}</span>
        </div>

        <div className="now-playing-progress" aria-hidden="true"><i /></div>

        <div className="now-playing-controls" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M11 6v12L3 12zM21 6v12l-8-6z" /></svg>
          {isLive
            ? <svg viewBox="0 0 24 24" className="is-main"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
            : <svg viewBox="0 0 24 24" className="is-main"><path d="M7 4l13 8-13 8z" /></svg>}
          <svg viewBox="0 0 24 24"><path d="M13 6v12l8-6zM3 6v12l8-6z" /></svg>
        </div>
      </div>

      {(topArtist || topTrack) && (
        <dl className="top-listens">
          {topArtist && (
            <div>
              <dt>Top artist · 30 days</dt>
              <dd>{topArtist.name}</dd>
              <dd className="top-listens-plays">{topArtist.playCount.toLocaleString()} plays</dd>
            </div>
          )}
          {topTrack && (
            <div>
              <dt>Top song · 30 days</dt>
              <dd>{topTrack.title}</dd>
              <dd className="top-listens-plays">{topTrack.artist} · {topTrack.playCount.toLocaleString()} plays</dd>
            </div>
          )}
        </dl>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// ItemDetails: everything below the title. Used by the card and the 2D page.
// ---------------------------------------------------------------------------
export function ItemDetails({
  item, onOpenImage, nowPlaying, selectedRecordIndex, onSelectRecord, browseRecordIndex, onBrowseRecord,
}) {
  const images = item.images ?? [];
  // Only the 3D card can pick an album; the 2D page always shows the full list
  const pickedRecord = onSelectRecord && selectedRecordIndex != null ? records[selectedRecordIndex] : null;

  // Keep the raised record's row in view while scrolling through the crate
  const recordRowRefs = useRef([]);
  useEffect(() => {
    if (item.id !== 'records' || browseRecordIndex == null) return;
    recordRowRefs.current[browseRecordIndex]?.scrollIntoView({ block: 'nearest' });
  }, [item.id, browseRecordIndex]);

  return (
    <>
      {item.pitch && <p className="card-pitch">{item.pitch}</p>}

      {(item.role || item.dates) && (
        <dl className="card-facts">
          {item.role && (<div><dt>Role</dt><dd>{item.role}</dd></div>)}
          {item.dates && (<div><dt>When</dt><dd>{item.dates}</dd></div>)}
        </dl>
      )}

      <p className="card-summary">{item.summary}</p>

      {/* Turntable: what's playing */}
      {item.id === 'turntable' && nowPlaying && <NowPlayingPlayer nowPlaying={nowPlaying} />}

      {/* Record crate, one album picked: its story (the album floats beside the card) */}
      {item.id === 'records' && pickedRecord && (
        <section className="record-detail" aria-live="polite">
          <button type="button" className="record-back" onClick={() => onSelectRecord(null)}>← All records</button>
          <h3 className="record-detail-title">{pickedRecord.title}</h3>
          <p className="record-detail-meta">
            {pickedRecord.artist} · {pickedRecord.year}
            {pickedRecord.edition && ` · ${pickedRecord.edition}`}
          </p>

          {pickedRecord.source && (
            <>
              <h4 className="card-heading">Where I got it</h4>
              <p className="record-detail-text">{pickedRecord.source}</p>
            </>
          )}
          {pickedRecord.note && (
            <>
              <h4 className="card-heading">What it means to me</h4>
              <p className="record-detail-text">{pickedRecord.note}</p>
            </>
          )}
          {!pickedRecord.source && !pickedRecord.note && (
            <p className="card-note">I haven't written this one up yet.</p>
          )}
        </section>
      )}

      {/* Record crate: the whole collection */}
      {item.id === 'records' && !pickedRecord && (
        <ol className="record-list">
          {records.map((record, recordIndex) => {
            const isSelected = onSelectRecord && browseRecordIndex === recordIndex; // raised in the crate
            const rowContent = (
              <>
                <span className="record-year">{record.year}</span>
                <span className="record-title">
                  {record.title}
                  {record.edition && <em> ({record.edition})</em>}
                </span>
                <span className="record-artist">{record.artist}</span>
              </>
            );
            return (
              <li key={`${record.artist}-${record.title}`}>
                {onSelectRecord ? (
                  <button
                    ref={(element) => { recordRowRefs.current[recordIndex] = element; }}
                    type="button"
                    className={isSelected ? 'record-row is-selected' : 'record-row'}
                    onMouseEnter={() => onBrowseRecord?.(recordIndex)}
                    onFocus={() => onBrowseRecord?.(recordIndex)}
                    onClick={() => onSelectRecord(recordIndex)}
                  >
                    {rowContent}
                  </button>
                ) : (
                  <div className="record-row">{rowContent}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {item.results?.length > 0 && (
        <>
          <h3 className="card-heading">Results</h3>
          <ul className="card-results">
            {item.results.map((result) => <li key={result}>{result}</li>)}
          </ul>
        </>
      )}

      {item.tech?.length > 0 && (
        <>
          <h3 className="card-heading">Tech</h3>
          <ul className="card-chips">
            {item.tech.map((techName) => <li key={techName}>{techName}</li>)}
          </ul>
        </>
      )}

      {images.length > 0 && (
        <>
          <h3 className="card-heading">Photos</h3>
          <div className="card-gallery">
            {images.map((imageUrl, imageIndex) => (
              <button
                key={imageUrl}
                type="button"
                className="card-thumb"
                onClick={() => onOpenImage(imageUrl)}
                aria-label={`Enlarge photo ${imageIndex + 1} of ${images.length}`}
              >
                <img src={encodeURI(imageUrl)} alt={`${item.name}, photo ${imageIndex + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}

      {item.links?.length > 0 && (
        <div className="card-links">
          {item.links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
          ))}
        </div>
      )}

      {item.private && <p className="card-note">Group class project, so the code isn't public.</p>}
    </>
  );
}

// ---------------------------------------------------------------------------
// Lightbox: one enlarged photo over everything else
// ---------------------------------------------------------------------------
export function Lightbox({ imageUrl, onClose }) {
  if (!imageUrl) return null;
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Enlarged photo" onClick={onClose}>
      <img src={encodeURI(imageUrl)} alt="" />
      <button type="button" className="icon-button lightbox-close" onClick={onClose} aria-label="Close photo">✕</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProjectCard
// ---------------------------------------------------------------------------
export default function ProjectCard({
  item, onClose, nowPlaying, selectedRecordIndex, onSelectRecord, browseRecordIndex, onBrowseRecord,
}) {
  const [enlargedImage, setEnlargedImage] = useState(null);
  const closeButtonRef = useRef(null);

  // Move keyboard focus into the card when it opens or changes
  useEffect(() => {
    setEnlargedImage(null);
    closeButtonRef.current?.focus({ preventScroll: true });
  }, [item.id]);

  return (
    <>
      <aside className="project-card" aria-labelledby="project-card-title">
        <header className="card-header">
          <div>
            <span className="card-eyebrow">{item.kind}</span>
            <h2 id="project-card-title">{item.name}</h2>
          </div>
          <button ref={closeButtonRef} type="button" className="icon-button" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="card-body">
          <ItemDetails
            item={item}
            onOpenImage={setEnlargedImage}
            nowPlaying={nowPlaying}
            selectedRecordIndex={selectedRecordIndex}
            onSelectRecord={onSelectRecord}
            browseRecordIndex={browseRecordIndex}
            onBrowseRecord={onBrowseRecord}
          />
        </div>
      </aside>

      <Lightbox imageUrl={enlargedImage} onClose={() => setEnlargedImage(null)} />
    </>
  );
}
