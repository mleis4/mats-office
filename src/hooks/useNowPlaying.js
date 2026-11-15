/*
 * ============================================================================
 * Program Name:   useNowPlaying.js
 * Author:         Mats Leis
 * Student Number: 251409940
 * Date:           November 14, 2026
 * Description:    Asks Last.fm what I'm listening to (Spotify scrobbles to
 *                 Last.fm) and re-checks every 45 seconds. If Last.fm isn't
 *                 set up or the request fails, it falls back to a record
 *                 from the crate so the turntable is never empty.
 *
 *                 Setup: create a .env.local file with
 *                   VITE_LASTFM_USER=your-username
 *                   VITE_LASTFM_KEY=your-read-only-api-key
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import records from '../data/records.json';

const LASTFM_USER = import.meta.env.VITE_LASTFM_USER;
const LASTFM_KEY = import.meta.env.VITE_LASTFM_KEY;
const POLL_INTERVAL_MS = 45000;

// Pick the fallback record once per visit
const fallbackRecord = records[Math.floor(Math.random() * records.length)];
const FALLBACK = {
  status: 'fallback', // 'live' | 'recent' | 'fallback'
  title: fallbackRecord.title,
  artist: fallbackRecord.artist,
  artUrl: null,
};

export default function useNowPlaying() {
  const [nowPlaying, setNowPlaying] = useState(FALLBACK);

  useEffect(() => {
    if (!LASTFM_USER || !LASTFM_KEY) return undefined; // not configured yet

    let isCancelled = false;

    const fetchLatestTrack = async () => {
      try {
        const requestUrl = 'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks'
          + `&user=${encodeURIComponent(LASTFM_USER)}&api_key=${encodeURIComponent(LASTFM_KEY)}&format=json&limit=1`;
        const response = await fetch(requestUrl);
        if (!response.ok) throw new Error(`Last.fm responded ${response.status}`);

        const data = await response.json();
        const latestTrack = [].concat(data?.recenttracks?.track ?? [])[0];
        if (!latestTrack) throw new Error('No recent tracks');

        const largestImage = (latestTrack.image ?? []).at(-1)?.['#text'] || null;
        if (!isCancelled) {
          setNowPlaying({
            status: latestTrack['@attr']?.nowplaying === 'true' ? 'live' : 'recent',
            title: latestTrack.name,
            artist: latestTrack.artist?.['#text'] ?? '',
            artUrl: largestImage,
          });
        }
      } catch {
        if (!isCancelled) setNowPlaying(FALLBACK);
      }
    };

    fetchLatestTrack();
    const pollTimer = setInterval(fetchLatestTrack, POLL_INTERVAL_MS);
    return () => {
      isCancelled = true;
      clearInterval(pollTimer);
    };
  }, []);

  return nowPlaying;
}
