function toYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    let embedUrl = null;
    if (parsed.hostname.includes('youtu.be')) {
      embedUrl = `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    } else if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') embedUrl = `https://www.youtube.com/embed/${parsed.searchParams.get('v')}`;
      else if (parsed.pathname.startsWith('/embed/')) embedUrl = url;
      else if (parsed.pathname.startsWith('/shorts/')) embedUrl = `https://www.youtube.com/embed/${parsed.pathname.split('/')[2]}`;
    }
    return embedUrl || url;
  } catch {
    return url;
  }
}

function getYoutubeId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2];
      if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2];
    }
    return null;
  } catch {
    return null;
  }
}

function getYoutubeThumbnail(url) {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

module.exports = { toYoutubeEmbedUrl, getYoutubeId, getYoutubeThumbnail };
