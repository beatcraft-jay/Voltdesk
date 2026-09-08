import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Sparkles,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Download,
  Link as LinkIcon,
  Settings,
  Key,
  Globe,
  Save,
} from "lucide-react";

import "../styles/MaterialsPage.css";

type Material = {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
  supplier: string;
  notes?: string;
  image_path?: string | null;
  image_url?: string | null;
  image_source?: string | null;
  image_data?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ImageResult = {
  url: string;
  thumbnail?: string;
  title?: string;
  source?: string;
  width?: number;
  height?: number;
};

type SortOption =
  | "name"
  | "category"
  | "price-low"
  | "price-high"
  | "updated";

type ViewMode = "grouped" | "list";

const CATEGORIES = [
  "Cables",
  "Conduit & Trunking",
  "Switches & Sockets",
  "Protection",
  "Lighting",
  "Accessories",
  "Industrial",
  "Solar",
  "Other",
];

const UNITS = [
  "pcs",
  "length",
  "metre",
  "packet",
  "pack",
  "roll",
  "100m roll",
  "pair",
  "set",
  "kg",
];

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString("en-UG")}`;
}

function formatDate(date?: string) {
  if (!date) return "—";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "—";
  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMaterialUnit(category: string, currentUnit?: string) {
  if (category === "Cables") return "100m roll";
  return currentUnit || "pcs";
}

function getImageSource(material: Material) {
  return (
    material.image_data ||
    material.image_path ||
    material.image_url ||
    ""
  );
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("category");
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});

  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cables");
  const [unit, setUnit] = useState("100m roll");
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");

  /* =========================================
     SETTINGS STATE
  ========================================= */

  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [searchEngineId, setSearchEngineId] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  /* =========================================
     IMAGE MANAGER
  ========================================= */

  const [imageMaterial, setImageMaterial] =
    useState<Material | null>(null);

  const [imageResults, setImageResults] =
    useState<ImageResult[]>([]);

  const [selectedImage, setSelectedImage] =
    useState<ImageResult | null>(null);

  const [imageSearch, setImageSearch] =
    useState("");

  const [isSearchingImages, setIsSearchingImages] =
    useState(false);

  const [isSavingImage, setIsSavingImage] =
    useState(false);

  const [imageError, setImageError] =
    useState("");

  /* =========================================
     LOAD MATERIALS
  ========================================= */

  async function loadMaterials() {
    try {
      setIsLoading(true);
      if (!window.electronAPI?.materials) {
        throw new Error("Materials API is not available.");
      }
      const data = await window.electronAPI.materials.getAll();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load materials:", error);
      alert(
        error instanceof Error ? error.message : "Failed to load materials."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  /* =========================================
     LOAD SETTINGS
  ========================================= */

  async function loadSettings() {
    try {
      setIsLoadingSettings(true);
      const api = window.electronAPI?.settings;
      
      if (!api) {
        console.warn("Settings API not available");
        return;
      }

      const [apiKey, engineId] = await Promise.all([
        api.getGoogleImagesKey ? api.getGoogleImagesKey() : Promise.resolve(""),
        api.getGoogleSearchEngineId ? api.getGoogleSearchEngineId() : Promise.resolve(""),
      ]);

      setGoogleApiKey(apiKey || "");
      setSearchEngineId(engineId || "");
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoadingSettings(false);
    }
  }

  /* =========================================
     SAVE SETTINGS
  ========================================= */

  async function saveSettings() {
    try {
      const api = window.electronAPI?.settings;
      
      if (!api) {
        throw new Error("Settings API not available");
      }

      const trimmedApiKey = googleApiKey.trim();
      const trimmedEngineId = searchEngineId.trim();

      if (!trimmedApiKey) {
        alert("Please enter your Google API Key");
        return;
      }

      if (!trimmedEngineId) {
        alert("Please enter your Search Engine ID (cx)");
        return;
      }

      await Promise.all([
        api.setGoogleImagesKey(trimmedApiKey),
        api.setGoogleSearchEngineId(trimmedEngineId),
      ]);

      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      
      alert("Google Image Search settings saved successfully!");
      setShowSettings(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert(
        error instanceof Error
          ? `Failed to save settings: ${error.message}`
          : "Failed to save settings."
      );
    }
  }

  /* =========================================
     FILTER + SORT
  ========================================= */

  const filteredMaterials = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    const result = materials.filter((material) => {
      const searchableText = [
        material.name,
        material.category,
        material.unit,
        material.supplier,
        material.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchTerm || searchableText.includes(searchTerm);

      const matchesCategory =
        categoryFilter === "All" || material.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "category":
          return (
            a.category.localeCompare(b.category) ||
            a.name.localeCompare(b.name)
          );
        case "price-low":
          return Number(a.price || 0) - Number(b.price || 0);
        case "price-high":
          return Number(b.price || 0) - Number(a.price || 0);
        case "updated": {
          const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return bDate - aDate;
        }
        default:
          return 0;
      }
    });
  }, [materials, search, categoryFilter, sortBy]);

  const categoriesInUse = useMemo(() => {
    const categorySet = new Set(
      materials
        .map((material) => material.category?.trim())
        .filter(Boolean)
    );
    return ["All", ...Array.from(categorySet).sort()];
  }, [materials]);

  /* Group filtered materials by category (preserve sort order within groups) */
  const materialsByCategory = useMemo(() => {
    const groups = new Map<string, Material[]>();

    for (const material of filteredMaterials) {
      const key = material.category?.trim() || "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(material);
    }

    // Prefer known category order, then alphabetical for extras
    const preferred = CATEGORIES.filter((c) => groups.has(c));
    const extras = [...groups.keys()]
      .filter((c) => !CATEGORIES.includes(c))
      .sort((a, b) => a.localeCompare(b));

    const orderedKeys = [...preferred, ...extras];

    return orderedKeys.map((key) => ({
      category: key,
      items: groups.get(key) || [],
    }));
  }, [filteredMaterials]);

  function toggleCategory(categoryName: string) {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  }

  function expandAll() {
    setCollapsedCategories({});
  }

  function collapseAll() {
    const next: Record<string, boolean> = {};
    for (const group of materialsByCategory) {
      next[group.category] = true;
    }
    setCollapsedCategories(next);
  }

  /* =========================================
     FORM
  ========================================= */

  function resetForm() {
    setName("");
    setCategory("Cables");
    setUnit("100m roll");
    setPrice("");
    setSupplier("");
    setNotes("");
    setEditing(null);
  }

  function openAdd() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(material: Material) {
    const materialCategory = material.category || "Other";
    setEditing(material);
    setName(material.name || "");
    setCategory(materialCategory);
    setUnit(getMaterialUnit(materialCategory, material.unit));
    setPrice(
      material.price !== undefined && material.price !== null
        ? String(material.price)
        : ""
    );
    setSupplier(material.supplier || "");
    setNotes(material.notes || "");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function handleCategoryChange(newCategory: string) {
    setCategory(newCategory);
    if (newCategory === "Cables") {
      setUnit("100m roll");
    } else if (unit === "100m roll") {
      setUnit("pcs");
    }
  }

  /* =========================================
     SAVE MATERIAL
  ========================================= */

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      alert("Material name is required.");
      return;
    }
    if (!price.trim()) {
      alert("Please enter a price.");
      return;
    }
    if (isSaving) return;

    setIsSaving(true);

    try {
      if (!window.electronAPI?.materials) {
        throw new Error("Materials API is not available.");
      }

      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        throw new Error("Please enter a valid price.");
      }

      const payload = {
        name: name.trim(),
        category: category || "Other",
        unit: category === "Cables" ? "100m roll" : unit || "pcs",
        price: numericPrice,
        supplier: supplier.trim(),
        notes: notes.trim(),
      };

      if (editing) {
        await window.electronAPI.materials.update({
          ...payload,
          id: editing.id,
        });
      } else {
        await window.electronAPI.materials.create(payload);
      }

      await loadMaterials();
      closeForm();
    } catch (error: unknown) {
      console.error("Failed to save material:", error);
      const message =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to save material: ${message}`);
    } finally {
      setIsSaving(false);
    }
  }

  /* =========================================
     DELETE MATERIAL
  ========================================= */

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this material?"
    );
    if (!confirmed) return;

    try {
      if (!window.electronAPI?.materials) {
        throw new Error("Materials API is not available.");
      }
      await window.electronAPI.materials.delete(id);
      setMaterials((current) =>
        current.filter((material) => material.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete material:", error);
      alert(
        error instanceof Error
          ? `Failed to delete material: ${error.message}`
          : "Failed to delete material."
      );
    }
  }

  /* =========================================
     OPEN IMAGE MANAGER
  ========================================= */

  function openImageManager(
    material: Material
  ) {
    setImageMaterial(material);
    setImageResults([]);
    setSelectedImage(null);
    setImageError("");
    setImageSearch(
      `${material.name}${  
        material.category
          ? ` ${material.category}`
          : ""
      }`
    );
  }

  function closeImageManager() {
    if (
      isSearchingImages ||
      isSavingImage
    ) {
      return;
    }
    setImageMaterial(null);
    setImageResults([]);
    setSelectedImage(null);
    setImageError("");
  }

  /* =========================================
     SEARCH GOOGLE IMAGES
  ========================================= */

  async function searchMaterialImages() {
    if (!imageMaterial) return;

    const query =
      imageSearch.trim() ||
      `${imageMaterial.name} ${
        imageMaterial.category || ""
      }`;

    if (!query.trim()) {
      setImageError(
        "Enter a material name to search."
      );
      return;
    }

    const api =
      window.electronAPI?.materials;

    if (!api?.searchImages) {
      setImageError(
        "Image search is not connected. The Electron image-search IPC needs to be added to main.cjs and preload.cjs."
      );
      return;
    }

    setIsSearchingImages(true);
    setImageError("");
    setSelectedImage(null);

    try {
      const response =
        await api.searchImages(query);

      const results =
        Array.isArray(response)
          ? response
          : Array.isArray(
              response?.items
            )
          ? response.items
          : [];

      const cleanedResults =
        results
          .filter(
            (item: ImageResult) =>
              item &&
              typeof item.url ===
                "string" &&
              item.url.trim()
          )
          .slice(0, 20);

      setImageResults(
        cleanedResults
      );

      if (
        cleanedResults.length === 0
      ) {
        setImageError(
          "No matching images were found."
        );
      }
    } catch (error) {
      console.error(error);
      setImageError(
        error instanceof Error
          ? error.message
          : "Failed to search for images."
      );
    } finally {
      setIsSearchingImages(false);
    }
  }

  /* =========================================
     SAVE SELECTED IMAGE
  ========================================= */

  async function saveSelectedImage() {
    if (
      !imageMaterial ||
      !selectedImage
    ) {
      return;
    }

    const api =
      window.electronAPI?.materials;

    if (!api?.saveImage) {
      setImageError(
        "Image saving is not connected. The Electron save-image IPC needs to be added to main.cjs and preload.cjs."
      );
      return;
    }

    setIsSavingImage(true);
    setImageError("");

    try {
      const response =
        await api.saveImage({
          materialId:
            imageMaterial.id,
          imageUrl:
            selectedImage.url,
          source:
            selectedImage.source ||
            "Google Images",
          title:
            selectedImage.title ||
            imageMaterial.name,
        });

      const updatedMaterial =
        response?.material ||
        response ||
        null;

      if (
        updatedMaterial?.id
      ) {
        setMaterials((current) =>
          current.map(
            (material) =>
              material.id ===
              updatedMaterial.id
                ? {
                    ...material,
                    ...updatedMaterial,
                  }
                : material
          )
        );
        setImageMaterial(
          updatedMaterial
        );
      } else {
        await loadMaterials();
        const refreshed =
          materials.find(
            (material) =>
              material.id ===
              imageMaterial.id
          );
        if (refreshed) {
          setImageMaterial(
            refreshed
          );
        }
      }

      setSelectedImage(null);
    } catch (error) {
      console.error(error);
      setImageError(
        error instanceof Error
          ? error.message
          : "Failed to save image."
      );
    } finally {
      setIsSavingImage(false);
    }
  }

  /* =========================================
     REMOVE IMAGE
  ========================================= */

  async function removeMaterialImage() {
    if (!imageMaterial) return;

    const api =
      window.electronAPI?.materials;

    if (!api?.removeImage) {
      setImageError(
        "Image removal is not connected. The Electron remove-image IPC needs to be added to main.cjs and preload.cjs."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Remove the saved image from "${imageMaterial.name}"?`
      );
    if (!confirmed) return;

    try {
      const response =
        await api.removeImage(
          imageMaterial.id
        );

      const updatedMaterial =
        response?.material ||
        response ||
        null;

      setMaterials((current) =>
        current.map((material) => {
          if (
            material.id !==
            imageMaterial.id
          ) {
            return material;
          }
          return updatedMaterial?.id
            ? {
                ...material,
                ...updatedMaterial,
              }
            : {
                ...material,
                image_path: null,
                image_url: null,
                image_source: null,
                image_data: null,
              };
        })
      );

      setImageMaterial((current) =>
        current
          ? {
              ...current,
              image_path: null,
              image_url: null,
              image_source: null,
              image_data: null,
            }
          : null
      );
    } catch (error) {
      console.error(error);
      setImageError(
        error instanceof Error
          ? error.message
          : "Failed to remove image."
      );
    }
  }

  /* =========================================
     MATERIAL IMAGE
  ========================================= */

  function renderMaterialImage(
    material: Material,
    size = 46
  ) {
    const src =
      getImageSource(material);

    if (!src) {
      return (
        <div
          className="material-table-icon"
          style={{
            width: size,
            height: size,
            minWidth: size,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <Package size={18} />
        </div>
      );
    }

    return (
      <div
        className="material-table-icon"
        style={{
          width: size,
          height: size,
          minWidth: size,
          overflow: "hidden",
          padding: 0,
          background: "#f3f4f6",
        }}
      >
        <img
          src={src}
          alt={material.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(event) => {
            event.currentTarget.style.display =
              "none";
          }}
        />
      </div>
    );
  }

  /* =========================================
     RENDER MATERIAL ROW
  ========================================= */

  function renderMaterialRow(material: Material) {
    return (
      <tr key={material.id}>
        <td className="material-name-cell">
          {renderMaterialImage(material)}
          <div className="material-info">
            <strong>{material.name}</strong>
            {material.notes && (
              <span className="material-notes">{material.notes}</span>
            )}
          </div>
        </td>
        <td>
          <span className="category-badge">
            {material.category || "Other"}
          </span>
        </td>
        <td>
          <span className="unit-badge">
            {material.category === "Cables" ? "100m roll" : material.unit}
          </span>
        </td>
        <td className="material-price-cell">
          {formatCurrency(material.price)}
        </td>
        <td className="supplier-cell">{material.supplier || "—"}</td>
        <td className="updated-cell">
          {formatDate(material.updated_at || material.created_at)}
        </td>
        <td>
          <div className="material-actions">
            <button
              className="table-action"
              onClick={() =>
                openImageManager(
                  material
                )
              }
              title={
                getImageSource(
                  material
                )
                  ? "Change material image"
                  : "Find material image"
              }
              type="button"
            >
              <ImageIcon
                size={17}
              />
            </button>
            <button
              className="table-action"
              onClick={() => openEdit(material)}
              title="Edit material"
              type="button"
            >
              <Pencil size={17} />
            </button>
            <button
              className="table-action delete-action"
              onClick={() => handleDelete(material.id)}
              title="Delete material"
              type="button"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="materials-page">
      <div className="materials-header">
        <div>
          <p className="page-eyebrow">INVENTORY MANAGEMENT</p>
          <h1>Materials & Prices</h1>
          <p className="page-description">
            Build and maintain an up-to-date electrical materials price
            database for quotations and projects.
          </p>
        </div>

        <div className="materials-header-actions">
          <button
            className="secondary-button"
            onClick={loadMaterials}
            disabled={isLoading}
            title="Refresh materials"
            type="button"
          >
            <RefreshCw
              size={18}
              className={isLoading ? "refreshing-icon" : ""}
            />
            Refresh
          </button>

          <button
            className="secondary-button"
            onClick={() => {
              loadSettings();
              setShowSettings(true);
            }}
            title="Configure Google Image Search"
            type="button"
          >
            <Settings size={18} />
            Settings
          </button>

          <button
            className="primary-button"
            onClick={openAdd}
            type="button"
          >
            <Plus size={18} />
            Add Material
          </button>
        </div>
      </div>

      <div className="ai-price-card">
        <div className="ai-price-icon">
          <Sparkles size={24} />
        </div>
        <div className="ai-price-content">
          <p className="section-eyebrow">MARKET INTELLIGENCE</p>
          <h3>Build a reliable material price list</h3>
          <p>
            Materials are grouped by category for faster browsing. Cable prices
            are stored per 100 metre roll. You can also add reference images to
            materials for easy identification.
          </p>
        </div>
        <button
          className="secondary-button ai-button"
          disabled
          type="button"
        >
          <TrendingUp size={18} />
          Price Updates Soon
        </button>
      </div>

      <div className="materials-card">
        <div className="materials-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search material, brand, supplier or category..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
          >
            {categoriesInUse.map((categoryName) => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>

          <select
            className="category-filter"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as SortOption)
            }
            aria-label="Sort materials"
          >
            <option value="category">Sort: Category</option>
            <option value="name">Sort: Name A–Z</option>
            <option value="price-low">Sort: Lowest Price</option>
            <option value="price-high">Sort: Highest Price</option>
            <option value="updated">Sort: Recently Updated</option>
          </select>

          <div className="view-toggle">
            <button
              type="button"
              className={viewMode === "grouped" ? "active" : ""}
              onClick={() => setViewMode("grouped")}
              title="Grouped by category"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
              title="Flat list"
            >
              <List size={16} />
            </button>
          </div>

          <div className="materials-count">
            {filteredMaterials.length} material
            {filteredMaterials.length !== 1 ? "s" : ""}
          </div>
        </div>

        {viewMode === "grouped" &&
          materialsByCategory.length > 1 &&
          !isLoading && (
            <div className="category-quick-actions">
              <button type="button" onClick={expandAll}>
                Expand all
              </button>
              <span className="dot">·</span>
              <button type="button" onClick={collapseAll}>
                Collapse all
              </button>
              <span className="dot">·</span>
              <span className="group-count">
                {materialsByCategory.length} categories
              </span>
            </div>
          )}

        <div className="materials-table-wrapper">
          {isLoading ? (
            <div className="materials-empty-state">
              <Package size={42} />
              <h3>Loading materials...</h3>
              <p>
                Please wait while VoltDesk loads your materials database.
              </p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="materials-empty-state">
              <Package size={42} />
              <h3>No materials found</h3>
              <p>
                Try changing your search or filter, or add a new material.
              </p>
              <button
                className="primary-button"
                onClick={openAdd}
                type="button"
              >
                <Plus size={18} />
                Add Material
              </button>
            </div>
          ) : viewMode === "list" ? (
            <table className="materials-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Market Price</th>
                  <th>Supplier / Source</th>
                  <th>Last Updated</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>{filteredMaterials.map(renderMaterialRow)}</tbody>
            </table>
          ) : (
            <div className="materials-groups">
              {materialsByCategory.map((group) => {
                const isCollapsed = Boolean(
                  collapsedCategories[group.category]
                );

                return (
                  <section
                    key={group.category}
                    className="material-category-group"
                    id={`category-${group.category
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")}`}
                  >
                    <button
                      type="button"
                      className="material-category-header"
                      onClick={() => toggleCategory(group.category)}
                      aria-expanded={!isCollapsed}
                    >
                      <span className="category-header-left">
                        {isCollapsed ? (
                          <ChevronRight size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                        <span className="category-title">
                          {group.category}
                        </span>
                        <span className="category-count">
                          {group.items.length}
                        </span>
                      </span>
                      <span className="category-header-hint">
                        {isCollapsed ? "Show" : "Hide"}
                      </span>
                    </button>

                    {!isCollapsed && (
                      <div className="material-category-body">
                        <table className="materials-table">
                          <thead>
                            <tr>
                              <th>Material</th>
                              <th>Category</th>
                              <th>Unit</th>
                              <th>Market Price</th>
                              <th>Supplier / Source</th>
                              <th>Last Updated</th>
                              <th className="actions-column">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map(renderMaterialRow)}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SETTINGS MODAL */}

      {showSettings &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div
              className="material-modal"
              onClick={(event) => event.stopPropagation()}
              style={{ maxWidth: 580 }}
            >
              <div className="modal-header">
                <div>
                  <p className="page-eyebrow">IMAGE SEARCH SETTINGS</p>
                  <h2>Google Image Search Configuration</h2>
                </div>
                <button
                  className="close-button"
                  onClick={() => setShowSettings(false)}
                  type="button"
                  aria-label="Close settings"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="settings-content">
                <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
                  Configure your Google Custom Search API keys to enable material
                  image search. Get your keys from the Google Cloud Console.
                </p>

                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Key size={16} />
                    Google API Key *
                  </label>
                  <input
                    type="password"
                    value={googleApiKey}
                    onChange={(e) => setGoogleApiKey(e.target.value)}
                    placeholder="Enter your Google API Key"
                    disabled={isLoadingSettings}
                  />
                  <small className="form-hint">
                    From Google Cloud Console → APIs & Services → Credentials
                  </small>
                </div>

                <div className="form-group" style={{ marginTop: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Globe size={16} />
                    Search Engine ID (cx) *
                  </label>
                  <input
                    type="text"
                    value={searchEngineId}
                    onChange={(e) => setSearchEngineId(e.target.value)}
                    placeholder="e.g. 16c5b8086a34949d1"
                    disabled={isLoadingSettings}
                  />
                  <small className="form-hint">
                    From cse.google.com/cse/all → Your search engine → Setup
                  </small>
                </div>

                <div style={{ marginTop: 8, padding: 12, background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#0369a1" }}>
                    <strong>💡 Need keys?</strong> Enable the Custom Search API in 
                    Google Cloud Console and create a Programmable Search Engine 
                    with <code>*</code> as the site to search.
                  </p>
                </div>

                <div className="modal-actions" style={{ marginTop: 24 }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowSettings(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={saveSettings}
                    disabled={isLoadingSettings}
                  >
                    <Save size={17} />
                    {isLoadingSettings ? "Loading..." : "Save Settings"}
                  </button>
                </div>

                {settingsSaved && (
                  <div style={{ marginTop: 12, padding: 10, background: "#d1fae5", borderRadius: 8, color: "#065f46", fontSize: 13, textAlign: "center" }}>
                    ✅ Settings saved successfully!
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ADD / EDIT MODAL */}

      {showForm &&
        createPortal(
          <div className="modal-overlay" onClick={closeForm}>
            <div
              className="material-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <p className="page-eyebrow">
                    {editing ? "EDIT MATERIAL" : "NEW MATERIAL"}
                  </p>
                  <h2>{editing ? "Edit Material" : "Add Material"}</h2>
                </div>
                <button
                  className="close-button"
                  onClick={closeForm}
                  type="button"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label>Material Name *</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. CHINT 32A MCB"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={category}
                      onChange={(event) =>
                        handleCategoryChange(event.target.value)
                      }
                    >
                      {CATEGORIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Unit</label>
                    <select
                      value={category === "Cables" ? "100m roll" : unit}
                      disabled={category === "Cables"}
                      onChange={(event) => setUnit(event.target.value)}
                    >
                      {category === "Cables" ? (
                        <option value="100m roll">100m roll</option>
                      ) : (
                        UNITS.filter((item) => item !== "100m roll").map(
                          (item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          )
                        )
                      )}
                    </select>
                    {category === "Cables" && (
                      <small className="form-hint">
                        Cables are stored and priced per 100 metre roll.
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price (UGX) *</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="e.g. 250000"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Supplier / Source</label>
                    <input
                      value={supplier}
                      onChange={(event) => setSupplier(event.target.value)}
                      placeholder="e.g. CHINT Uganda or Tronic"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Brand, rating, packaging, model or other useful information..."
                    rows={3}
                  />
                </div>

                {editing && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      marginBottom: 16,
                    }}
                  >
                    {renderMaterialImage(editing, 58)}
                    <div style={{ flex: 1 }}>
                      <strong>Material image</strong>
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
                        {getImageSource(editing)
                          ? "An image is saved for this material."
                          : "No image saved yet."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        closeForm();
                        openImageManager(editing);
                      }}
                    >
                      <ImageIcon size={16} />
                      {getImageSource(editing) ? "Change" : "Find Image"}
                    </button>
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isSaving}
                  >
                    {isSaving
                      ? "Saving..."
                      : editing
                      ? "Update Material"
                      : "Save Material"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* IMAGE SEARCH MODAL */}

      {imageMaterial &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={closeImageManager}
            style={{ zIndex: 1100 }}
          >
            <div
              className="material-modal"
              onClick={(event) => event.stopPropagation()}
              style={{
                width: "min(980px, calc(100vw - 32px))",
                maxHeight: "90vh",
                overflow: "auto",
              }}
            >
              <div className="modal-header">
                <div>
                  <p className="page-eyebrow">MATERIAL IMAGE</p>
                  <h2>{imageMaterial.name}</h2>
                </div>
                <button
                  className="close-button"
                  onClick={closeImageManager}
                  type="button"
                  aria-label="Close image manager"
                >
                  <X size={20} />
                </button>
              </div>

              {/* IMAGE SEARCH */}

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                  <input
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "11px 13px",
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                    }}
                    value={imageSearch}
                    onChange={(event) => setImageSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void searchMaterialImages();
                      }
                    }}
                    placeholder="Search Google Images..."
                  />
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => void searchMaterialImages()}
                    disabled={isSearchingImages}
                  >
                    <Search size={17} />
                    {isSearchingImages ? "Searching..." : "Search Images"}
                  </button>
                </div>
                <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 12 }}>
                  Search using the material name plus its category, then choose the most useful reference image.
                </p>
              </div>

              {/* ERROR */}

              {imageError && (
                <div
                  style={{
                    padding: 12,
                    marginBottom: 16,
                    borderRadius: 8,
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    color: "#9a3412",
                    fontSize: 13,
                  }}
                >
                  {imageError}
                </div>
              )}

              {/* CURRENT IMAGE */}

              {getImageSource(imageMaterial) && (
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    padding: 14,
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    marginBottom: 18,
                  }}
                >
                  <img
                    src={getImageSource(imageMaterial)}
                    alt={imageMaterial.name}
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "contain",
                      borderRadius: 8,
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong>Saved image</strong>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
                      This image will remain associated with this material.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void removeMaterialImage()}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              )}

              {/* SEARCH RESULTS */}

              {imageResults.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 14,
                  }}
                >
                  {imageResults.map((image, index) => {
                    const thumbnail = image.thumbnail || image.url;
                    const isSelected = selectedImage?.url === image.url;
                    return (
                      <button
                        key={`${image.url}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        style={{
                          border: isSelected
                            ? "3px solid #2563eb"
                            : "1px solid #e5e7eb",
                          borderRadius: 10,
                          background: "#fff",
                          padding: 7,
                          cursor: "pointer",
                          textAlign: "left",
                          overflow: "hidden",
                        }}
                        title={image.title || "Select image"}
                      >
                        <img
                          src={thumbnail}
                          alt={image.title || imageMaterial.name}
                          style={{
                            width: "100%",
                            height: 120,
                            objectFit: "cover",
                            borderRadius: 6,
                            background: "#f8fafc",
                            display: "block",
                          }}
                          loading="lazy"
                        />
                        <span
                          style={{
                            display: "block",
                            marginTop: 7,
                            fontSize: 11,
                            color: "#4b5563",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {image.title || image.source || "Image result"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* EMPTY STATE */}

              {!isSearchingImages &&
                imageResults.length === 0 &&
                !imageError && (
                  <div style={{ textAlign: "center", padding: "42px 20px", color: "#6b7280" }}>
                    <ImageIcon size={42} style={{ marginBottom: 10 }} />
                    <h3 style={{ margin: "0 0 6px", color: "#111827" }}>
                      Search for a material image
                    </h3>
                    <p style={{ margin: 0 }}>Search results will appear here.</p>
                  </div>
                )}

              {/* FOOTER */}

              <div className="modal-actions" style={{ marginTop: 20 }}>
                {selectedImage ? (
                  <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#4b5563" }}>
                    <Download size={16} />
                    Image selected
                    {selectedImage.source ? ` • ${selectedImage.source}` : ""}
                  </div>
                ) : (
                  <div style={{ flex: 1 }} />
                )}

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeImageManager}
                  disabled={isSavingImage}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void saveSelectedImage()}
                  disabled={!selectedImage || isSavingImage}
                >
                  <Download size={17} />
                  {isSavingImage ? "Saving Image..." : "Save Image"}
                </button>
              </div>

              {/* SOURCE URL */}

              {selectedImage?.url && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    color: "#6b7280",
                    overflow: "hidden",
                  }}
                >
                  <LinkIcon size={13} />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedImage.url}
                  </span>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}