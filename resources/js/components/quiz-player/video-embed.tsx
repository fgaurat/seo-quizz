function getEmbedUrl(url: string): string | null {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
}

export default function VideoEmbed({ url }: { url: string }) {
    const embedUrl = getEmbedUrl(url);

    if (!embedUrl) {
        return <p className="quiz-video-error">Format vidéo non supporté.</p>;
    }

    return (
        <div className="quiz-video-container">
            <iframe
                src={embedUrl}
                className="quiz-video-iframe"
                allowFullScreen
                allow="autoplay; encrypted-media"
            />
        </div>
    );
}
