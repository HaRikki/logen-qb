/**
 * Analytics Module — LocalStorage based click & play tracking
 * Ready for Backend integration later
 */
const Analytics = (() => {
  function trackVisit() {
    const data = Storage.load();
    data.analytics.visits = (data.analytics.visits || 0) + 1;
    Storage.save(data);
  }

  function trackClick(linkId) {
    const data = Storage.load();
    data.analytics.totalClicks = (data.analytics.totalClicks || 0) + 1;
    if (!data.analytics.linkClicks) data.analytics.linkClicks = {};
    data.analytics.linkClicks[linkId] = (data.analytics.linkClicks[linkId] || 0) + 1;
    Storage.save(data);
  }

  function trackPlay(songId) {
    const data = Storage.load();
    if (!data.analytics.musicPlays) data.analytics.musicPlays = {};
    data.analytics.musicPlays[songId] = (data.analytics.musicPlays[songId] || 0) + 1;
    Storage.save(data);
  }

  function getStats() {
    const data = Storage.load();
    const a = data.analytics || {};
    const linkClicks = a.linkClicks || {};
    let mostClicked = null;
    let maxC = 0;
    for (const [id, c] of Object.entries(linkClicks)) {
      if (c > maxC) { maxC = c; mostClicked = id; }
    }
    const musicPlays = a.musicPlays || {};
    let mostPlayed = null;
    let maxP = 0;
    for (const [id, p] of Object.entries(musicPlays)) {
      if (p > maxP) { maxP = p; mostPlayed = id; }
    }
    return {
      totalClicks: a.totalClicks || 0,
      visits: a.visits || 0,
      linkClicks,
      musicPlays,
      mostClicked,
      mostPlayed
    };
  }

  return { trackVisit, trackClick, trackPlay, getStats };
})();
