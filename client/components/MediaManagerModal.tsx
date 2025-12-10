import { useState } from "react";
import { Post } from "@shared/api";
import { CloseIcon, TrashIcon, VideoIcon, ImageIcon } from "./Icons";
import { toast } from "sonner";

interface MediaManagerModalProps {
  post: Post;
  onClose: () => void;
  onUpdate: (post: Post) => void;
}

export default function MediaManagerModal({
  post,
  onClose,
  onUpdate,
}: MediaManagerModalProps) {
  const [deletingFileName, setDeletingFileName] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [mediaFiles, setMediaFiles] = useState(post.mediaFiles);

  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "bmp",
      "ico",
      "tiff",
      "tif",
    ];
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    return imageExtensions.includes(ext);
  };

  const isVideoFile = (fileName: string): boolean => {
    const videoExtensions = [
      "mp4",
      "webm",
      "mov",
      "avi",
      "mkv",
      "flv",
      "m4v",
      "mpg",
      "mpeg",
      "mts",
      "m2ts",
      "wmv",
      "mxf",
      "ogv",
    ];
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    return videoExtensions.includes(ext);
  };

  const handleDeleteMedia = async () => {
    if (!deletingFileName) return;

    try {
      setIsDeletingFile(true);

      const response = await fetch(
        `/api/posts/${post.id}/media/${encodeURIComponent(deletingFileName)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete media file");
      }

      const updatedFiles = mediaFiles.filter(
        (file) => file.name !== deletingFileName,
      );
      setMediaFiles(updatedFiles);

      onUpdate({
        ...post,
        mediaFiles: updatedFiles,
      });

      toast.success("Media file deleted successfully");
    } catch (error) {
      console.error("Error deleting media file:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete media file",
      );
    } finally {
      setIsDeletingFile(false);
      setDeletingFileName(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-card border border-border rounded-xl w-full max-w-3xl p-6 shadow-xl my-8 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground">
            Manage Media Files
          </h3>
          <button
            onClick={onClose}
            disabled={isDeletingFile}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Post Info */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-foreground text-sm mb-2">
            Post: {post.title}
          </h4>
          <p className="text-xs text-muted-foreground">ID: {post.id}</p>
        </div>

        {/* Media Files List */}
        {mediaFiles.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mediaFiles.map((file) => (
              <div
                key={file.name}
                className="bg-muted/50 border border-border rounded-lg p-4 flex items-center justify-between hover:border-accent/50 transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isImageFile(file.name) ? (
                    <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  ) : isVideoFile(file.name) ? (
                    <VideoIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 text-gray-500 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                      📄
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Type: {file.type}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-all"
                  >
                    View
                  </a>
                  <button
                    onClick={() => setDeletingFileName(file.name)}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-all flex items-center gap-1.5"
                  >
                    <TrashIcon className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              No media files in this post
            </p>
          </div>
        )}

        {/* Close Button */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isDeletingFile}
            className="flex-1 px-4 py-2 bg-accent text-accent-foreground font-medium rounded-lg hover:bg-accent/90 disabled:opacity-40 transition-all"
          >
            Done
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingFileName && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-6 shadow-xl animate-fadeIn">
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
              Delete Media File?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              File: <span className="font-semibold">{deletingFileName}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this media file? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingFileName(null)}
                disabled={isDeletingFile}
                className="flex-1 px-4 py-2 bg-card border border-border text-foreground font-medium rounded-lg hover:bg-muted disabled:opacity-40 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMedia}
                disabled={isDeletingFile}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                {isDeletingFile ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
