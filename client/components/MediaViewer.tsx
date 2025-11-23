import { useState, useRef } from "react";
import {
  X,
  Maximize2,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MediaFile {
  name: string;
  url: string;
  type: string;
}

interface MediaViewerProps {
  mediaFiles: MediaFile[];
  postTitle: string;
}

export default function MediaViewer({
  mediaFiles,
  postTitle,
}: MediaViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState<boolean[]>(
    new Array(mediaFiles.length).fill(false),
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentMedia = mediaFiles[activeIndex];
  const isImage = currentMedia.type.startsWith("image/");
  const isVideo = currentMedia.type.startsWith("video/");
  const isAudio = currentMedia.type.startsWith("audio/");

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? mediaFiles.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === mediaFiles.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentMedia.url;
    link.download = currentMedia.name;
    link.click();
  };

  const handleImageError = (idx: number) => {
    const newErrors = [...imageLoadError];
    newErrors[idx] = true;
    setImageLoadError(newErrors);
  };

  const handleVideoFullscreen = async () => {
    if (videoRef.current) {
      try {
        if (videoRef.current.requestFullscreen) {
          await videoRef.current.requestFullscreen();
        } else if ((videoRef.current as any).webkitRequestFullscreen) {
          await (videoRef.current as any).webkitRequestFullscreen();
        } else if ((videoRef.current as any).mozRequestFullScreen) {
          await (videoRef.current as any).mozRequestFullScreen();
        } else if ((videoRef.current as any).msRequestFullscreen) {
          await (videoRef.current as any).msRequestFullscreen();
        }
      } catch (err) {
        console.error("Error requesting fullscreen:", err);
      }
    }
  };

  if (mediaFiles.length === 0) return null;

  return (
    <>
      {/* Media Grid */}
      <div className="border-t border-border pt-12">
        <div className="flex items-center gap-2 mb-6">
          <svg
            className="w-6 h-6 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 0 18.8-4.3M22 4.5a10 10 0 0 0-18.8 4.3"></path>
          </svg>
          <h2 className="text-2xl font-bold">Attached Media</h2>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {mediaFiles.map((file, idx) => {
            const isVideo = file.type.startsWith("video/");
            const isAudio = file.type.startsWith("audio/");
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveIndex(idx);
                  if (file.type.startsWith("image/")) {
                    setLightboxOpen(true);
                  }
                }}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all hover:border-accent cursor-pointer ${
                  activeIndex === idx
                    ? "border-accent"
                    : "border-border"
                }`}
              >
                {file.type.startsWith("image/") ? (
                  <>
                    {!imageLoadError[idx] ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={() => handleImageError(idx)}
                        crossOrigin="anonymous"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-muted flex items-center justify-center">
                        <div className="text-center">
                          <svg
                            className="w-8 h-8 mx-auto mb-2 text-muted-foreground"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            ></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <p className="text-xs text-muted-foreground">
                            Image Error
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : isVideo ? (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
                        <svg
                          className="w-6 h-6 text-accent"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      </div>
                      <p className="text-xs text-muted-foreground">Video</p>
                    </div>
                  </div>
                ) : file.type.startsWith("audio/") ? (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
                        <svg
                          className="w-6 h-6 text-accent"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path>
                        </svg>
                      </div>
                      <p className="text-xs text-muted-foreground">Audio</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
                        <svg
                          className="w-6 h-6 text-accent"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-6z"></path>
                        </svg>
                      </div>
                      <p className="text-xs text-muted-foreground">File</p>
                    </div>
                  </div>
                )}

                {/* Hover Overlay - only for images */}
                {!isVideo && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-6 h-6 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Current Media Preview */}
        {mediaFiles.length > 1 && (
          <div className="bg-muted rounded-lg overflow-hidden border border-border">
            <div className="relative">
              {isImage && !imageLoadError[activeIndex] && (
                <img
                  src={currentMedia.url}
                  alt={currentMedia.name}
                  className="w-full max-h-96 object-contain"
                  onError={() => handleImageError(activeIndex)}
                  crossOrigin="anonymous"
                />
              )}

              {isImage && imageLoadError[activeIndex] && (
                <div className="w-full max-h-96 bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <p className="text-muted-foreground">Image unavailable</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {currentMedia.name}
                    </p>
                  </div>
                </div>
              )}

              {isVideo && (
                <video
                  ref={videoRef}
                  key={`video-${activeIndex}`}
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  crossOrigin="anonymous"
                  className="w-full max-h-96 object-contain bg-black"
                >
                  <source src={currentMedia.url} type={currentMedia.type} />
                  Your browser does not support the video tag.
                </video>
              )}

              {isAudio && (
                <div className="w-full bg-black flex flex-col items-center justify-center p-8 min-h-32 gap-4">
                  <div className="text-4xl">🎵</div>
                  <audio
                    key={`audio-${activeIndex}`}
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                    crossOrigin="anonymous"
                    className="w-full"
                  >
                    <source src={currentMedia.url} type={currentMedia.type} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Navigation Buttons */}
              {mediaFiles.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                    aria-label="Previous media"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                    aria-label="Next media"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Media Counter */}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                {activeIndex + 1} / {mediaFiles.length}
              </div>
            </div>

            {/* Media Info and Actions */}
            <div className="p-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground truncate">
                  {currentMedia.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentMedia.type}
                </p>
              </div>
              <div className="flex gap-2">
                {isVideo && (
                  <button
                    onClick={handleVideoFullscreen}
                    className="p-2 rounded-lg bg-card border border-border hover:border-accent text-foreground hover:text-accent transition-all"
                    title="Fullscreen"
                    aria-label="Enter fullscreen"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                )}
                {isImage && (
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="p-2 rounded-lg bg-card border border-border hover:border-accent text-foreground hover:text-accent transition-all"
                    title="Expand"
                    aria-label="Expand image"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg bg-card border border-border hover:border-accent text-foreground hover:text-accent transition-all"
                  title="Download"
                  aria-label="Download media"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Images */}
      {lightboxOpen && isImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-50"
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8" />
          </button>

          <div
            className="max-w-6xl max-h-[90vh] w-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {!imageLoadError[activeIndex] ? (
              <img
                src={currentMedia.url}
                alt={currentMedia.name}
                className="flex-1 object-contain"
                onError={() => handleImageError(activeIndex)}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex-1 bg-muted flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-24 h-24 mx-auto mb-4 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <p className="text-white text-lg">Image unavailable</p>
                  <p className="text-gray-400 mt-2">{currentMedia.name}</p>
                </div>
              </div>
            )}

            {/* Lightbox Navigation */}
            {mediaFiles.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            {/* Lightbox Info */}
            <div className="mt-4 flex items-center justify-between text-white">
              <div>
                <p className="font-medium truncate">{currentMedia.name}</p>
                <p className="text-sm text-gray-400">
                  {activeIndex + 1} / {mediaFiles.length}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                title="Download"
                aria-label="Download image"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
