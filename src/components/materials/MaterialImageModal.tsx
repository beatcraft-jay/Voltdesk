import { FormEvent, useEffect, useState } from "react";
import {
  Image as ImageIcon,
  Search,
  X,
  Check,
  Download,
  Trash2,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

type Material = {
  id: number;
  name: string;
  category?: string;
  notes?: string;
  image_path?: string | null;
  image_url?: string | null;
  image_source?: string | null;
  image_data?: string | null;
};

type ImageResult = {
  id?: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  sourceName?: string;
};

type MaterialImageModalProps = {
  material: Material;
  onClose: () => void;
  onSaved: (material: Material) => void;
};

export default function MaterialImageModal({
  material,
  onClose,
  onSaved,
}: MaterialImageModalProps) {
  const [query, setQuery] = useState(
    `${material.name} ${material.category || ""}`.trim()
  );

  const [images, setImages] = useState<ImageResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  const existingImage =
    material.image_data || material.image_path || material.image_url || null;

  useEffect(() => {
    searchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchImages(event?: FormEvent) {
    event?.preventDefault();

    if (!query.trim()) {
      setError("Enter a material name to search.");
      return;
    }

    setLoading(true);
    setError("");
    setDebugInfo("");

    try {
      // Check if the API is available
      if (!window.electronAPI?.materials?.searchImages) {
        throw new Error(
          "Image search API is not available. Make sure the Electron preload script is properly configured."
        );
      }

      // Get settings to debug
      try {
        const apiKey = await window.electronAPI.settings.getGoogleImagesKey();
        const engineId = await window.electronAPI.settings.getGoogleSearchEngineId();
        setDebugInfo(
          `API Key: ${apiKey ? "✅ Set" : "❌ Missing"} | ` +
          `Search Engine ID: ${engineId ? "✅ Set" : "❌ Missing"}`
        );
      } catch (settingsErr) {
        console.warn("Could not read settings:", settingsErr);
      }

      const response = await window.electronAPI.materials.searchImages(query.trim());

      console.log("Search response:", response);

      if (!response) {
        throw new Error("No response from the image search service.");
      }

      if (!response?.success) {
        const errorMsg = response?.error || "Unable to search for material images.";
        throw new Error(errorMsg);
      }

      const results = Array.isArray(response.items) ? response.items : [];

      setImages(results);

      if (results.length === 0) {
        setError("No matching images were found. Try a different search term.");
      }
    } catch (err) {
      console.error("Material image search failed:", err);

      setImages([]);

      const errorMessage = err instanceof Error ? err.message : "Unable to search for images.";
      setError(errorMessage);

      // If the error is about API keys, show helpful message
      if (errorMessage.toLowerCase().includes("api key") || 
          errorMessage.toLowerCase().includes("search engine")) {
        setDebugInfo(
          "💡 You need to configure Google Image Search in Settings. " +
          "Go to Materials → Settings and add your Google API Key and Search Engine ID."
        );
      } else if (errorMessage.toLowerCase().includes("quota")) {
        setDebugInfo(
          "💡 You've reached the daily quota for Google Image Search (100 requests/day). " +
          "Try again tomorrow or consider using Unsplash API."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveSelectedImage() {
    if (!selectedImage) {
      setError("Select an image first.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await window.electronAPI.materials.saveImage({
        materialId: material.id,
        imageUrl: selectedImage.imageUrl,
        sourceUrl: selectedImage.sourceUrl || "",
        sourceName: selectedImage.sourceName || "",
      });

      console.log("Save response:", response);

      if (!response?.success) {
        throw new Error(response?.error || "Unable to save the image.");
      }

      if (response.material) {
        onSaved(response.material);
      }

      onClose();
    } catch (err) {
      console.error("Saving material image failed:", err);
      setError(err instanceof Error ? err.message : "Unable to save the image.");
    } finally {
      setSaving(false);
    }
  }

  async function removeExistingImage() {
    if (!material.id) return;

    const confirmed = window.confirm(
      `Remove the saved image from "${material.name}"?`
    );

    if (!confirmed) return;

    setRemoving(true);
    setError("");

    try {
      const response = await window.electronAPI.materials.removeImage(material.id);

      if (!response?.success) {
        throw new Error(response?.error || "Unable to remove the image.");
      }

      if (response.material) {
        onSaved(response.material);
      }

      onClose();
    } catch (err) {
      console.error("Removing material image failed:", err);
      setError(err instanceof Error ? err.message : "Unable to remove the image.");
    } finally {
      setRemoving(false);
    }
  }

  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="material-image-overlay"
      onMouseDown={handleOverlayClick}
    >
      <div
        className="material-image-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="material-image-modal-header">
          <div>
            <div className="material-image-modal-title">
              <ImageIcon size={20} />
              <div>
                <h2>Material Image</h2>
                <p>{material.name}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="material-image-close"
            onClick={onClose}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* SEARCH */}
        <form className="material-image-search" onSubmit={searchImages}>
          <div className="material-image-search-input">
            <Search size={18} />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for this material..."
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="material-image-search-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={17} className="material-image-spinner" />
                Searching...
              </>
            ) : (
              <>
                <Search size={17} />
                Search
              </>
            )}
          </button>
        </form>

        {/* DEBUG INFO */}
        {debugInfo && (
          <div className="material-image-debug">
            <AlertCircle size={16} />
            <span>{debugInfo}</span>
          </div>
        )}

        {/* CURRENT IMAGE */}
        {existingImage && (
          <div className="material-current-image">
            <div className="material-current-image-heading">
              <div>
                <strong>Current Image</strong>
                <span>This image is already saved for this material.</span>
              </div>
              <button
                type="button"
                className="material-remove-image-button"
                onClick={removeExistingImage}
                disabled={removing}
              >
                {removing ? (
                  <Loader2 size={16} className="material-image-spinner" />
                ) : (
                  <Trash2 size={16} />
                )}
                Remove
              </button>
            </div>
            <div className="material-current-image-preview">
              <img
                src={existingImage}
                alt={material.name}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="material-image-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* RESULTS */}
        <div className="material-image-results-header">
          <div>
            <strong>Image Search Results</strong>
            <span>
              {images.length > 0
                ? `${images.length} images found`
                : "Choose an image to save"}
            </span>
          </div>
        </div>

        <div className="material-image-results">
          {loading ? (
            <div className="material-image-loading">
              <Loader2 size={30} className="material-image-spinner" />
              <span>Searching for images...</span>
            </div>
          ) : images.length === 0 ? (
            <div className="material-image-empty">
              <ImageIcon size={42} />
              <h3>No images yet</h3>
              <p>
                Search for the material above to find matching product images.
              </p>
            </div>
          ) : (
            <div className="material-image-grid">
              {images.map((image, index) => {
                const isSelected = selectedImage === image;
                return (
                  <button
                    type="button"
                    key={image.id || `${image.imageUrl}-${index}`}
                    className={`material-image-result ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedImage(image)}
                    title={image.title}
                  >
                    <div className="material-image-thumbnail">
                      <img
                        src={image.thumbnailUrl || image.imageUrl}
                        alt={image.title}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                      {isSelected && (
                        <div className="material-image-selected">
                          <Check size={22} />
                        </div>
                      )}
                    </div>
                    <div className="material-image-result-info">
                      <span>{image.title || "Material image"}</span>
                      {image.sourceName && <small>{image.sourceName}</small>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* SELECTED IMAGE */}
        {selectedImage && (
          <div className="material-selected-image">
            <div>
              <strong>Selected Image</strong>
              <span>
                This image will be downloaded and stored locally in VoltDesk.
              </span>
            </div>
            <div className="material-selected-image-info">
              <img
                src={selectedImage.thumbnailUrl || selectedImage.imageUrl}
                alt={selectedImage.title}
              />
              <div>
                <strong>{selectedImage.title}</strong>
                {selectedImage.sourceName && (
                  <span>Source: {selectedImage.sourceName}</span>
                )}
                {selectedImage.sourceUrl && (
                  <a
                    href={selectedImage.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                    View source
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="material-image-modal-footer">
          <button
            type="button"
            className="material-image-cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="material-image-save-button"
            onClick={saveSelectedImage}
            disabled={!selectedImage || saving}
          >
            {saving ? (
              <>
                <Loader2 size={17} className="material-image-spinner" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={17} />
                Save Image
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}