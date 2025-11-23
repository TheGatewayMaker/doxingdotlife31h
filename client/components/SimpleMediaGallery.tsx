import { useState } from "react";

interface MediaFile {
  name: string;
  url: string;
  type: string;
}

interface SimpleMediaGalleryProps {
  mediaFiles: MediaFile[];
  postTitle: string;
}

const getMediaIcon = (type: string): string => {
  if (type.startsWith("image/")) return "🖼️";
  if (type.startsWith("video/")) return "🎬";
  if (type.startsWith("audio/")) return "🎵";
  return "📄";
};

const getFileExtension = (url: string): string => {
  return url.split(".").pop()?.toUpperCase() || "FILE";
};

export default function SimpleMediaGallery({
  mediaFiles,
  postTitle,
}: SimpleMediaGalleryProps) {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  if (mediaFiles.length === 0) return null;

  const currentMedia = mediaFiles[selectedMediaIndex];
  const isImage = currentMedia.type.startsWith("image/");
  const isVideo = currentMedia.type.startsWith("video/");
  const isAudio = currentMedia.type.startsWith("audio/");

  return (
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

      {/* Thumbnail Grid - All clickable */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        {mediaFiles.map((file, idx) => {
          const isImg = file.type.startsWith("image/");
          const isVid = file.type.startsWith("video/");

          return (
            <a
              key={idx}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                // For images and videos, let browser handle it natively
                // This allows proper fullscreen, download, etc.
              }}
              className={`relative group rounded-lg overflow-hidden border-2 transition-all hover:border-accent cursor-pointer ${
                selectedMediaIndex === idx ? "border-accent" : "border-border"
              }`}
            >
              {isImg ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                  crossOrigin="anonymous"
                  loading="lazy"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedMediaIndex(idx);
                  }}
                />
              ) : isVid ? (
                <div className="w-full aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                  <video
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    crossOrigin="anonymous"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedMediaIndex(idx);
                    }}
                  >
                    <source src={file.url} type={file.type} />
                  </video>
                </div>
              ) : (
                <div className="w-full aspect-square bg-muted flex items-center justify-center flex-col">
                  <div className="text-3xl mb-2">{getMediaIcon(file.type)}</div>
                  <p className="text-xs text-muted-foreground text-center px-2">
                    {getFileExtension(file.url)}
                  </p>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isImg && (
                  <span className="text-white text-sm font-semibold">View</span>
                )}
                {isVid && (
                  <span className="text-white text-sm font-semibold">Play</span>
                )}
              </div>
            </a>
          );
        })}
      </div>

      {/* Current Media Preview - Click to open in new tab */}
      {mediaFiles.length > 0 && (
        <div className="bg-muted rounded-lg overflow-hidden border border-border">
          <div className="relative bg-black">
            {isImage && (
              <a
                href={currentMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full group"
              >
                <img
                  src={currentMedia.url}
                  alt={currentMedia.name}
                  className="w-full max-h-96 object-contain group-hover:opacity-90 transition-opacity"
                  crossOrigin="anonymous"
                  onClick={(e) => {
                    // Allow browser to handle the click normally
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                  <span className="text-white font-semibold opacity-0 group-hover:opacity-100">
                    Click to open in new tab
                  </span>
                </div>
              </a>
            )}

            {isVideo && (
              <video
                controls
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
                <div className="text-6xl">🎵</div>
                <audio
                  controls
                  preload="metadata"
                  crossOrigin="anonymous"
                  className="w-full"
                >
                  <source src={currentMedia.url} type={currentMedia.type} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Media Counter */}
            {mediaFiles.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                {selectedMediaIndex + 1} / {mediaFiles.length}
              </div>
            )}
          </div>

          {/* Media Info */}
          <div className="p-4 border-t border-border flex items-center justify-between flex-wrap gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {currentMedia.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentMedia.type}
              </p>
            </div>
            <a
              href={currentMedia.url}
              download={currentMedia.name}
              className="px-4 py-2 bg-accent text-accent-foreground text-xs font-medium rounded-lg hover:bg-accent/90 transition-all"
            >
              Download
            </a>
          </div>
        </div>
      )}

      {/* Navigation for multiple media files */}
      {mediaFiles.length > 1 && (
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={() =>
              setSelectedMediaIndex((prev) =>
                prev === 0 ? mediaFiles.length - 1 : prev - 1,
              )
            }
            className="px-4 py-2 bg-card border border-border text-foreground font-medium rounded-lg hover:border-accent transition-all"
          >
            ← Previous
          </button>
          <div className="flex items-center gap-2">
            {mediaFiles.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMediaIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  selectedMediaIndex === idx
                    ? "bg-accent w-6"
                    : "bg-muted hover:bg-muted-foreground"
                }`}
                aria-label={`Go to media ${idx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() =>
              setSelectedMediaIndex((prev) =>
                prev === mediaFiles.length - 1 ? 0 : prev + 1,
              )
            }
            className="px-4 py-2 bg-card border border-border text-foreground font-medium rounded-lg hover:border-accent transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
