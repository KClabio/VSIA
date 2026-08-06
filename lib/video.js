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

module.exports = { toYoutubeEmbedUrl };
