/*
 * ============================================================================
 * Program Name:   useNowPlaying.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 15, 2026
 * Description:    Asks Last.fm what I'm listening to (Spotify scrobbles to
 *                 Last.fm) and re-checks every 45 seconds. It also asks once
 *                 for my top artist and top song of the last 30 days. If Last.fm isn't
 *                 set up or the request fails, it falls back to a record
 *                 from the crate so the turntable is never empty.
 *
 *                 Setup: create a .env.local file with
 *                   VITE_LASTFM_USERNAME=your-username
 *                   VITE_LASTFM_API_KEY=your-read-only-api-key
 * ============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import records from '../data/records.json';

const LASTFM_USER = import.meta.env.VITE_LASTFM_USERNAME;
const LASTFM_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';
const POLL_INTERVAL_MS = 45000;
const TOP_PERIOD = '1month'; // Last.fm period: overall | 7day | 1month | 3month | 6month | 12month

// Pick the fallback record once per visit
const fallbackRecord = records[Math.floor(Math.random() * records.length)];
const FALLBACK = {
  status: 'fallback', // 'live' | 'recent' | 'fallback'
  title: fallbackRecord.title,
  artist: fallbackRecord.artist,
  artUrl: fallbackRecord.front,
};

const NO_TOP_LISTENS = { topArtist: null, topTrack: null };

// ---------------------------------------------------------------------------
// fetchLastfm: one read-only Last.fm call for my account, returning the JSON
// ---------------------------------------------------------------------------
async function fetchLastfm(method, extraQuery = '') {
  const requestUrl = `${LASTFM_API_URL}?method=${method}`
    + `&user=${encodeURIComponent(LASTFM_USER)}&api_key=${encodeURIComponent(LASTFM_KEY)}&format=json&limit=1${extraQuery}`;
  const response = await fetch(requestUrl);
  if (!response.ok) throw new Error(`Last.fm responded ${response.status}`);
  return response.json();
}

// Last.fm returns one item as an object and several as an array
const firstOf = (itemOrList) => [].concat(itemOrList ?? [])[0];

export default function useNowPlaying() {
  const [latestTrack, setLatestTrack] = useState(FALLBACK);
  const [topListens, setTopListens] = useState(NO_TOP_LISTENS);

  // ---------------- What's playing: checked again every 45 seconds ----------------
  useEffect(() => {
    if (!LASTFM_USER || !LASTFM_KEY) return undefined; // not configured yet

    let isCancelled = false;

    const fetchLatestTrack = async () => {
      try {
        const data = await fetchLastfm('user.getrecenttracks');
        const track = firstOf(data?.recenttracks?.track);
        if (!track) throw new Error('No recent tracks');

        const largestImage = (track.image ?? []).at(-1)?.['#text'] || null;
        if (!isCancelled) {
          setLatestTrack({
            status: track['@attr']?.nowplaying === 'true' ? 'live' : 'recent',
            title: track.name,
            artist: track.artist?.['#text'] ?? '',
            artUrl: largestImage,
          });
        }
      } catch {
        if (!isCancelled) setLatestTrack(FALLBACK);
      }
    };

    fetchLatestTrack();
    const pollTimer = setInterval(fetchLatestTrack, POLL_INTERVAL_MS);
    return () => {
      isCancelled = true;
      clearInterval(pollTimer);
    };
  }, []);

  // ---------------- Top artist and top song: asked once per visit ----------------
  useEffect(() => {
    if (!LASTFM_USER || !LASTFM_KEY) return undefined;

    let isCancelled = false;

    const fetchTopListens = async () => {
      try {
        const [artistData, trackData] = await Promise.all([
          fetchLastfm('user.gettopartists', `&period=${TOP_PERIOD}`),
          fetchLastfm('user.gettoptracks', `&period=${TOP_PERIOD}`),
        ]);
        const artist = firstOf(artistData?.topartists?.artist);
        const track = firstOf(trackData?.toptracks?.track);

        if (!isCancelled) {
          setTopListens({
            topArtist: artist ? { name: artist.name, playCount: Number(artist.playcount) } : null,
            topTrack: track ? { title: track.name, artist: track.artist?.name ?? '', playCount: Number(track.playcount) } : null,
          });
        }
      } catch {
        if (!isCancelled) setTopListens(NO_TOP_LISTENS);
      }
    };

    fetchTopListens();
    return () => { isCancelled = true; };
  }, []);

  return useMemo(() => ({ ...latestTrack, ...topListens }), [latestTrack, topListens]);
}
