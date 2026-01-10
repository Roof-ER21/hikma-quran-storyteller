import React, { useState } from 'react';

interface ShareButtonProps {
  type: 'app' | 'story' | 'verse';
  storyId?: string;
  storyTitle?: string;
  surah?: number;
  verse?: number;
  verseText?: string;
  className?: string;
  iconOnly?: boolean;
}

interface ShareData {
  title: string;
  text: string;
  url: string;
}

export default function ShareButton({
  type,
  storyId,
  storyTitle,
  surah,
  verse,
  verseText,
  className = '',
  iconOnly = false,
}: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const getShareData = (): ShareData => {
    const baseUrl = window.location.origin;

    switch (type) {
      case 'app':
        return {
          title: "Alaya & Soad's Gift - Stories from Jannah",
          text: "Check out this beautiful Islamic app for kids and families! Stories of the Prophets, Quran recitation, and more.",
          url: baseUrl,
        };
      case 'story':
        return {
          title: storyTitle || `Story of Prophet ${storyId}`,
          text: `Read the beautiful story of Prophet ${storyId} in Alaya & Soad's Gift`,
          url: `${baseUrl}#/story/${encodeURIComponent(storyId || '')}`,
        };
      case 'verse':
        const shortText = verseText && verseText.length > 100
          ? verseText.substring(0, 100) + '...'
          : verseText;
        return {
          title: `Quran ${surah}:${verse}`,
          text: shortText
            ? `"${shortText}" - Quran ${surah}:${verse}`
            : `Read Quran Surah ${surah}, Verse ${verse}`,
          url: `${baseUrl}#/verse/${surah}:${verse}`,
        };
      default:
        return {
          title: "Alaya & Soad's Gift",
          text: "Islamic stories and Quran for the whole family",
          url: baseUrl,
        };
    }
  };

  const handleShare = async () => {
    const shareData = getShareData();

    // Try Web Share API first (native share on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to modal
        if ((err as Error).name !== 'AbortError') {
          console.log('Web Share failed, showing fallback modal');
        }
      }
    }

    // Fallback to modal
    setShowModal(true);
  };

  const handleCopyLink = async () => {
    const shareData = getShareData();
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsApp = () => {
    const shareData = getShareData();
    const text = `${shareData.text}\n\n${shareData.url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShowModal(false);
  };

  const handleEmail = () => {
    const shareData = getShareData();
    const subject = encodeURIComponent(shareData.title);
    const body = encodeURIComponent(`${shareData.text}\n\n${shareData.url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowModal(false);
  };

  const handleTwitter = () => {
    const shareData = getShareData();
    const text = `${shareData.text} ${shareData.url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    setShowModal(false);
  };

  const getIcon = () => {
    switch (type) {
      case 'verse':
        return 'fa-share-from-square';
      default:
        return 'fa-share-alt';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'app':
        return 'Share App';
      case 'story':
        return 'Share Story';
      case 'verse':
        return 'Share Verse';
      default:
        return 'Share';
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        className={`flex items-center gap-2 transition-colors ${className || 'px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600'}`}
        title={getLabel()}
      >
        <i className={`fas ${getIcon()}`}></i>
        {!iconOnly && <span className="text-sm">{getLabel()}</span>}
      </button>

      {/* Share Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
            >
              <i className="fas fa-times text-lg"></i>
            </button>

            <h3 className="text-lg font-semibold text-stone-800 mb-1">
              {getLabel()}
            </h3>
            <p className="text-sm text-stone-500 mb-6 line-clamp-2">
              {getShareData().text}
            </p>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-stone-50 transition-colors"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${copied ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-600'}`}>
                  <i className={`fas ${copied ? 'fa-check' : 'fa-link'} text-lg`}></i>
                </div>
                <span className="text-xs text-stone-600">{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-stone-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center">
                  <i className="fab fa-whatsapp text-xl"></i>
                </div>
                <span className="text-xs text-stone-600">WhatsApp</span>
              </button>

              <button
                onClick={handleTwitter}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-stone-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center">
                  <i className="fab fa-x-twitter text-lg"></i>
                </div>
                <span className="text-xs text-stone-600">X</span>
              </button>

              <button
                onClick={handleEmail}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-stone-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center">
                  <i className="fas fa-envelope text-lg"></i>
                </div>
                <span className="text-xs text-stone-600">Email</span>
              </button>
            </div>

            {/* URL Preview */}
            <div className="bg-stone-50 rounded-xl p-3 flex items-center gap-2">
              <i className="fas fa-link text-stone-400"></i>
              <span className="text-sm text-stone-600 truncate flex-1">
                {getShareData().url}
              </span>
              <button
                onClick={handleCopyLink}
                className="text-rose-600 hover:text-rose-700 text-sm font-medium"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
