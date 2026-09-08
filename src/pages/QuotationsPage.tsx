import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  Send,
  Clock,
  Package,
  Database,
  ChevronRight,
  Minus,
  Truck,
  LayoutGrid,
  List,
  Rows3,
  Briefcase,
} from "lucide-react";

import "../styles/QuotationsPage.css";
import logo from "../assets/branding/wamara-contractors-logo.png";

type Client = {
  id: number;
  name: string;
  phone: string;
  email: string;
  location: string;
};

type Material = {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
  supplier: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

type QuotationItem = {
  id?: number;
  item_name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
};

type Quotation = {
  id?: number;
  quotation_number: string;
  client_id?: number | null;
  client_name: string;
  client_phone: string;
  client_email: string;
  client_location: string;
  subject: string;
  description: string;
  subtotal: number;
  labour_cost: number;
  transport_cost: number;
  transport_description: string;
  total: number;
  status: string;
  terms: string;
  created_at?: string;
  items: QuotationItem[];
};

type Project = {
  id: number;
  name: string;
  client: string;
  location: string;
  start_date?: string;
  estimated_value?: number;
  status: string;
  progress?: number;
  quotation_id?: number | null;
};

type ViewMode = "list" | "grid" | "detailed";

const createEmptyQuotation = (): Quotation => ({
  quotation_number: "",
  client_id: null,
  client_name: "",
  client_phone: "",
  client_email: "",
  client_location: "",
  subject: "",
  description: "",
  subtotal: 0,
  labour_cost: 0,
  transport_cost: 0,
  transport_description: "",
  total: 0,
  status: "Draft",
  terms:
    "1. This quotation is valid for 30 days.\n" +
    "2. Prices may change depending on market conditions.\n" +
    "3. Work will begin after agreement and confirmation.",
  items: [
    {
      item_name: "",
      description: "",
      quantity: 1,
      unit: "pcs",
      unit_price: 0,
      total: 0,
    },
  ],
});

function generateQuotationNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);

  return `VD-${year}${month}-${random}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(date?: string) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  const [editingQuotation, setEditingQuotation] =
    useState<Quotation | null>(null);

  const [viewingQuotation, setViewingQuotation] =
    useState<Quotation | null>(null);

  const [form, setForm] =
    useState<Quotation>(createEmptyQuotation());

  const [includeLabour, setIncludeLabour] =
    useState(false);

  const [labourCost, setLabourCost] =
    useState(0);

  const [includeTransport, setIncludeTransport] =
    useState(false);

  const [transportCost, setTransportCost] =
    useState(0);

  const [transportDescription, setTransportDescription] =
    useState("");

  const [linkToExistingProject, setLinkToExistingProject] =
    useState(false);

  const [selectedProjectId, setSelectedProjectId] =
    useState<number | "">("");

  const [isSaving, setIsSaving] =
    useState(false);

  /* =========================================
     MATERIAL PICKER
  ========================================= */

  const [showMaterialPicker, setShowMaterialPicker] =
    useState(false);

  const [materialSearch, setMaterialSearch] =
    useState("");

  const [materialCategory, setMaterialCategory] =
    useState("All");

  const [selectedMaterial, setSelectedMaterial] =
    useState<Material | null>(null);

  const [materialQuantity, setMaterialQuantity] =
    useState(1);

  const [showCustomItem, setShowCustomItem] =
    useState(false);

  /* =========================================
     LOAD DATA
  ========================================= */

  async function loadData() {
    try {
      setIsLoading(true);

      if (
        !window.electronAPI?.quotations ||
        !window.electronAPI?.clients
      ) {
        console.error("electronAPI not available");
        return;
      }

      const requests: Promise<any>[] = [
        window.electronAPI.quotations.getAll(),
        window.electronAPI.clients.getAll(),
      ];

      if (window.electronAPI?.materials) {
        requests.push(
          window.electronAPI.materials.getAll()
        );
      } else {
        requests.push(Promise.resolve([]));
      }

      if (window.electronAPI?.projects) {
        requests.push(
          window.electronAPI.projects.getAll()
        );
      } else {
        requests.push(Promise.resolve([]));
      }

      const results = await Promise.all(requests);

      const quotationData = results[0];
      const clientData = results[1];
      const materialData = results[2];
      const projectData = results[3];

      setQuotations(
        Array.isArray(quotationData)
          ? quotationData
          : []
      );

      setClients(
        Array.isArray(clientData)
          ? clientData
          : []
      );

      setMaterials(
        Array.isArray(materialData)
          ? materialData
          : []
      );

      setProjects(
        Array.isArray(projectData)
          ? projectData
          : []
      );
    } catch (error) {
      console.error("Failed to load data:", error);

      alert(
        "Failed to load quotations. Please restart the app."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMaterials() {
    try {
      if (!window.electronAPI?.materials) {
        return;
      }

      const data =
        await window.electronAPI.materials.getAll();

      setMaterials(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load materials:",
        error
      );
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================
     FILTERED QUOTATIONS
  ========================================= */

  const filteredQuotations = useMemo(() => {
    const search =
      searchTerm.toLowerCase().trim();

    if (!search) {
      return quotations;
    }

    return quotations.filter((q) => {
      return (
        q.quotation_number
          ?.toLowerCase()
          .includes(search) ||
        q.client_name
          ?.toLowerCase()
          .includes(search) ||
        q.subject
          ?.toLowerCase()
          .includes(search)
      );
    });
  }, [
    quotations,
    searchTerm,
  ]);

  const stats = useMemo(() => {
    return {
      total: quotations.length,

      draft: quotations.filter(
        (q) => q.status === "Draft"
      ).length,

      sent: quotations.filter(
        (q) => q.status === "Sent"
      ).length,

      approved: quotations.filter(
        (q) => q.status === "Approved"
      ).length,
    };
  }, [quotations]);

  /* =========================================
     MATERIAL FILTERING
  ========================================= */

  const materialCategories = useMemo(() => {
    const categories = new Set(
      materials
        .map((material) =>
          material.category?.trim()
        )
        .filter(Boolean)
    );

    return [
      "All",
      ...Array.from(categories).sort(),
    ];
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    const search =
      materialSearch.trim().toLowerCase();

    return materials.filter((material) => {
      const searchableText = [
        material.name,
        material.category,
        material.supplier,
        material.notes,
        material.unit,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search ||
        searchableText.includes(search);

      const matchesCategory =
        materialCategory === "All" ||
        material.category === materialCategory;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    materials,
    materialSearch,
    materialCategory,
  ]);

  /* =========================================
     CREATE / EDIT / VIEW
  ========================================= */

  function openCreateModal() {
    const newQuotation =
      createEmptyQuotation();

    newQuotation.quotation_number =
      generateQuotationNumber();

    setForm(newQuotation);

    setEditingQuotation(null);

    setIncludeLabour(false);
    setLabourCost(0);

    setIncludeTransport(false);
    setTransportCost(0);
    setTransportDescription("");

    setLinkToExistingProject(false);
    setSelectedProjectId("");

    closeMaterialPicker();

    setShowEditor(true);
  }

  async function openEditModal(
    quotation: Quotation
  ) {
    try {
      const full =
        await window.electronAPI
          .quotations
          .getById(quotation.id!);

      if (!full) {
        alert("Could not load quotation.");
        return;
      }

      setEditingQuotation(full);

      setForm({
        ...full,
        transport_cost:
          Number(full.transport_cost) || 0,
        transport_description:
          full.transport_description || "",
        items:
          full.items?.length > 0
            ? full.items
            : createEmptyQuotation().items,
      });

      setLabourCost(
        Number(full.labour_cost) || 0
      );

      setIncludeLabour(
        Number(full.labour_cost) > 0
      );

      setTransportCost(
        Number(full.transport_cost) || 0
      );

      setIncludeTransport(
        Number(full.transport_cost) > 0
      );

      setTransportDescription(
        full.transport_description || ""
      );

      const linkedProject = projects.find(
        (p) => p.quotation_id === full.id
      );
      if (linkedProject) {
        setLinkToExistingProject(true);
        setSelectedProjectId(linkedProject.id);
      } else {
        setLinkToExistingProject(false);
        setSelectedProjectId("");
      }

      closeMaterialPicker();

      setShowEditor(true);
    } catch (error) {
      console.error(error);

      alert(
        "Failed to open quotation for editing."
      );
    }
  }

  async function openViewer(
    quotation: Quotation
  ) {
    try {
      const full =
        await window.electronAPI
          .quotations
          .getById(quotation.id!);

      if (!full) {
        alert("Could not load quotation.");
        return;
      }

      setViewingQuotation({
        ...full,
        labour_cost: Number(full.labour_cost) || 0,
        transport_cost: Number(full.transport_cost) || 0,
        transport_description: full.transport_description || "",
        subtotal: Number(full.subtotal) || 0,
        total: Number(full.total) || 0,
        items: Array.isArray(full.items) ? full.items : [],
      });
      setShowViewer(true);
    } catch (error) {
      console.error(error);

      alert("Failed to open quotation.");
    }
  }

  /* =========================================
     CLIENT SELECT
  ========================================= */

  function handleClientChange(
    clientId: number
  ) {
    const client =
      clients.find(
        (c) => c.id === clientId
      );

    if (!client) {
      return;
    }

    setForm((prev) => ({
      ...prev,

      client_id: client.id,

      client_name: client.name,

      client_phone:
        client.phone || "",

      client_email:
        client.email || "",

      client_location:
        client.location || "",
    }));
  }

  /* =========================================
     PROJECT SELECT - AUTO FILL CLIENT DETAILS
  ========================================= */

  function handleProjectSelect(projectId: number | "") {
    setSelectedProjectId(projectId);

    if (!projectId) {
      // Clear project-related fields if no project selected
      setForm((prev) => ({
        ...prev,
        subject: "",
        description: "",
        client_name: "",
        client_phone: "",
        client_email: "",
        client_location: "",
        client_id: null,
      }));
      setLabourCost(0);
      setIncludeLabour(false);
      return;
    }

    const project = projects.find((p) => p.id === Number(projectId));

    if (!project) {
      return;
    }

    // Auto-fill client details from the project
    const clientMatch = clients.find(
      (c) => c.name.toLowerCase() === project.client.toLowerCase()
    );

    setForm((prev) => ({
      ...prev,
      client_name: project.client || "",
      client_phone: clientMatch?.phone || "",
      client_email: clientMatch?.email || "",
      client_location: project.location || clientMatch?.location || "",
      client_id: clientMatch?.id || null,
      subject: project.name || prev.subject,
      description: `Project: ${project.name}\n${project.client ? `Client: ${project.client}` : ""}`,
    }));

    // Auto-set labour cost from project value if available
    if (project.estimated_value && project.estimated_value > 0) {
      setLabourCost(project.estimated_value);
      setIncludeLabour(true);
    }
  }

  /* =========================================
     MATERIAL PICKER
  ========================================= */

  function openMaterialPicker() {
    setMaterialSearch("");
    setMaterialCategory("All");
    setSelectedMaterial(null);
    setMaterialQuantity(1);
    setShowCustomItem(false);

    loadMaterials();

    setShowMaterialPicker(true);
  }

  function closeMaterialPicker() {
    setShowMaterialPicker(false);

    setMaterialSearch("");
    setMaterialCategory("All");

    setSelectedMaterial(null);
    setMaterialQuantity(1);

    setShowCustomItem(false);
  }

  function selectMaterial(
    material: Material
  ) {
    setSelectedMaterial(material);

    setMaterialQuantity(1);

    setShowCustomItem(false);
  }

  function addSelectedMaterial() {
    if (!selectedMaterial) {
      return;
    }

    const quantity =
      Math.max(
        1,
        Number(materialQuantity) || 1
      );

    const newItem: QuotationItem = {
      item_name:
        selectedMaterial.name,

      description:
        [
          selectedMaterial.supplier,
          selectedMaterial.notes,
        ]
          .filter(Boolean)
          .join(" • "),

      quantity,

      unit:
        selectedMaterial.unit || "pcs",

      unit_price:
        Number(selectedMaterial.price) || 0,

      total:
        quantity *
        (Number(selectedMaterial.price) || 0),
    };

    setForm((prev) => {
      const hasEmptyItem =
        prev.items.length === 1 &&
        !prev.items[0].item_name.trim();

      if (hasEmptyItem) {
        return {
          ...prev,
          items: [newItem],
        };
      }

      return {
        ...prev,
        items: [
          ...prev.items,
          newItem,
        ],
      };
    });

    closeMaterialPicker();
  }

  function startCustomItem() {
    setShowCustomItem(true);

    setSelectedMaterial(null);

    setMaterialSearch("");
  }

  /* =========================================
     ITEMS
  ========================================= */

  function addItem() {
    /*
      Important:
      If the material search/picker is open,
      close it before adding the next item.
    */

    closeMaterialPicker();

    setForm((prev) => ({
      ...prev,

      items: [
        ...prev.items,

        {
          item_name: "",
          description: "",
          quantity: 1,
          unit: "pcs",
          unit_price: 0,
          total: 0,
        },
      ],
    }));
  }

  function removeItem(index: number) {
    setForm((prev) => {
      if (prev.items.length <= 1) {
        return {
          ...prev,

          items: [
            {
              item_name: "",
              description: "",
              quantity: 1,
              unit: "pcs",
              unit_price: 0,
              total: 0,
            },
          ],
        };
      }

      return {
        ...prev,

        items:
          prev.items.filter(
            (_, i) => i !== index
          ),
      };
    });
  }

  function updateItem(
    index: number,
    field: keyof QuotationItem,
    value: string | number
  ) {
    setForm((prev) => {
      const updatedItems =
        [...prev.items];

      const item = {
        ...updatedItems[index],
        [field]: value,
      };

      const quantity =
        Number(item.quantity) || 0;

      const unitPrice =
        Number(item.unit_price) || 0;

      item.total =
        quantity * unitPrice;

      updatedItems[index] = item;

      return {
        ...prev,
        items: updatedItems,
      };
    });
  }

  /* =========================================
     TOTALS
  ========================================= */

  const subtotal =
    form.items.reduce(
      (sum, item) => {
        return (
          sum +
          (Number(item.quantity) || 0) *
            (Number(item.unit_price) || 0)
        );
      },
      0
    );

  const suggestedLabour =
    Math.round(subtotal * 0.37);

  const actualLabourCost =
    includeLabour
      ? Number(labourCost) || 0
      : 0;

  const actualTransportCost =
    includeTransport
      ? Number(transportCost) || 0
      : 0;

  const grandTotal =
    subtotal +
    actualLabourCost +
    actualTransportCost;

  /* =========================================
     SAVE NEW MATERIALS TO DATABASE
  ========================================= */

  async function saveNewMaterialsToDatabase(
    items: QuotationItem[]
  ) {
    if (!window.electronAPI?.materials?.create) {
      return;
    }

    const existingNames = new Set(
      materials.map((m) =>
        m.name.trim().toLowerCase()
      )
    );

    for (const item of items) {
      const name = item.item_name.trim();

      if (!name) continue;

      const normalizedName = name.toLowerCase();

      if (existingNames.has(normalizedName)) {
        continue;
      }

      try {
        await window.electronAPI.materials.create({
          name,
          category: "General",
          unit: item.unit || "pcs",
          price: Number(item.unit_price) || 0,
          supplier: "",
          notes: item.description || "",
        });

        existingNames.add(normalizedName);
      } catch (err) {
        console.error(
          "Failed to save material to database:",
          name,
          err
        );
      }
    }
  }

  /* =========================================
     SAVE
  ========================================= */

  async function handleSave(
    status: string = "Draft"
  ) {
    if (isSaving) {
      return;
    }

    if (!form.client_name.trim()) {
      alert(
        "Please select or enter a client name."
      );

      return;
    }

    if (!form.subject.trim()) {
      alert(
        "Please enter a quotation subject."
      );

      return;
    }

    if (linkToExistingProject && !selectedProjectId) {
      alert(
        "Please select a project to link, or turn off linking to an existing project."
      );
      return;
    }

    const validItems =
      form.items
        .filter((item) =>
          item.item_name.trim()
        )
        .map((item) => {
          const qty =
            Number(item.quantity) || 0;

          const price =
            Number(item.unit_price) || 0;

          return {
            ...item,

            quantity: qty,

            unit_price: price,

            total:
              qty * price,
          };
        });

    if (validItems.length === 0) {
      alert(
        "Please add at least one quotation item with a name."
      );

      return;
    }

    const quotationData: Quotation = {
      ...form,

      id:
        editingQuotation?.id,

      items:
        validItems,

      subtotal,

      labour_cost:
        actualLabourCost,

      transport_cost:
        actualTransportCost,

      transport_description:
        includeTransport
          ? transportDescription.trim()
          : "",

      total:
        grandTotal,

      status,
    };

    setIsSaving(true);

    try {
      // Save any new custom materials to the materials database
      await saveNewMaterialsToDatabase(validItems);

      let savedQuotation;

      if (editingQuotation?.id) {
        savedQuotation =
          await window.electronAPI
            .quotations
            .update(quotationData);
      } else {
        savedQuotation =
          await window.electronAPI
            .quotations
            .create(quotationData);
      }

      /*
        Project handling:
        - On create + Sent → create a new project
        - On update + Sent → update existing project value (do not create a new one)
      */

      if (
        linkToExistingProject &&
        selectedProjectId &&
        window.electronAPI?.projects?.update
      ) {
        try {
          const savedId =
            savedQuotation?.id ||
            quotationData.id;

          const project = projects.find(
            (p) => p.id === Number(selectedProjectId)
          );

          if (project && savedId) {
            await window.electronAPI.projects.update({
              ...project,
              quotation_id: savedId,
              name: project.name || quotationData.subject,
              client:
                project.client ||
                quotationData.client_name,
              location:
                project.location ||
                quotationData.client_location ||
                "",
              estimated_value:
                quotationData.labour_cost ||
                project.estimated_value ||
                0,
            });
          }
        } catch (err) {
          console.error(
            "Failed to link quotation to project:",
            err
          );
        }
      } else if (
        status === "Sent" &&
        window.electronAPI?.projects
      ) {
        const projectPayload = {
          name:
            quotationData.subject,

          client:
            quotationData.client_name,

          location:
            quotationData.client_location ||
            "",

          start_date:
            new Date()
              .toISOString()
              .slice(0, 10),

          estimated_value:
            quotationData.labour_cost || 0,

          status:
            "Not Started",

          progress: 0,

          quotation_id:
            savedQuotation?.id ||
            quotationData.id ||
            null,
        };

        try {
          if (editingQuotation?.id) {
            if (
              window.electronAPI.projects.updateByQuotationId
            ) {
              await window.electronAPI.projects.updateByQuotationId(
                editingQuotation.id,
                {
                  name: projectPayload.name,
                  client: projectPayload.client,
                  location: projectPayload.location,
                  estimated_value: projectPayload.estimated_value,
                }
              );
            } else if (
              window.electronAPI.projects.update
            ) {
              const existingProjects =
                await window.electronAPI.projects.getAll?.();

              const linked = Array.isArray(existingProjects)
                ? existingProjects.find(
                    (p: any) =>
                      p.quotation_id === editingQuotation.id
                  )
                : null;

              if (linked?.id) {
                await window.electronAPI.projects.update({
                  ...linked,
                  name: projectPayload.name,
                  client: projectPayload.client,
                  location: projectPayload.location,
                  estimated_value: projectPayload.estimated_value,
                });
              }
            }
          } else {
            await window.electronAPI.projects.create(
              projectPayload
            );
          }
        } catch (err) {
          console.error(
            "Failed to sync project:",
            err
          );
        }
      }

      await loadData();

      setShowEditor(false);

      setEditingQuotation(null);

      setForm(
        createEmptyQuotation()
      );

      setIncludeLabour(false);
      setLabourCost(0);

      setIncludeTransport(false);
      setTransportCost(0);
      setTransportDescription("");

      setLinkToExistingProject(false);
      setSelectedProjectId("");

      closeMaterialPicker();
    } catch (error: any) {
      console.error(
        "Failed to save quotation:",
        error
      );

      alert(
        "Failed to save quotation.\n\n" +
          (
            error?.message ||
            "Check the console for details."
          )
      );
    } finally {
      setIsSaving(false);
    }
  }

  /* =========================================
     DELETE
  ========================================= */

  async function handleDelete(
    id?: number
  ) {
    if (!id) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this quotation?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await window.electronAPI
        .quotations
        .delete(id);

      await loadData();

      setShowViewer(false);

      setViewingQuotation(null);
    } catch (error) {
      console.error(error);

      alert(
        "Failed to delete quotation."
      );
    }
  }

  /* =========================================
     PDF DOWNLOAD
  ========================================= */

  async function downloadPDF(
    quotation: Quotation
  ) {
    try {
      const loaded =
        quotation.items?.length
          ? quotation
          : await window.electronAPI
              .quotations
              .getById(
                quotation.id!
              );

      if (!loaded) {
        alert(
          "Could not load quotation for PDF."
        );

        return;
      }

      // Normalize numeric / optional fields so transport always renders when present
      const full = {
        ...loaded,
        labour_cost: Number(loaded.labour_cost) || 0,
        transport_cost: Number(loaded.transport_cost) || 0,
        transport_description: loaded.transport_description || "",
        subtotal: Number(loaded.subtotal) || 0,
        total: Number(loaded.total) || 0,
        items: Array.isArray(loaded.items) ? loaded.items : [],
      };

      let logoBase64 = "";

      try {
        const response =
          await fetch(logo);

        const blob =
          await response.blob();

        logoBase64 =
          await new Promise<string>(
            (resolve) => {
              const reader =
                new FileReader();

              reader.onloadend =
                () =>
                  resolve(
                    reader.result as string
                  );

              reader.readAsDataURL(
                blob
              );
            }
          );
      } catch (err) {
        console.warn(
          "Could not convert logo:",
          err
        );
      }

      const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

@page {
  size: A4;
  margin: 18mm 16mm 18mm 16mm;
}

body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;

  color: #1d2939;
  background: white;
  padding: 0;
  font-size: 11px;
  line-height: 1.4;
}

.quotation-document {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.document-content {
  flex: 1;
}

.document-top {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 2px solid #f5b700;
  margin-bottom: 22px;
}

.document-company {
  display: flex;
  align-items: center;
  gap: 14px;
}

.document-company img {
  width: 110px;
  height: 110px;
  object-fit: contain;
}

.document-company h2 {
  font-size: 20px;
  color: #1e3a5f;
  letter-spacing: 1px;
}

.document-company h3 {
  font-size: 11px;
  letter-spacing: 2px;
  color: #1d2939;
}

.document-company p {
  font-size: 10px;
  color: #667085;
  margin-top: 2px;
}

.document-info {
  text-align: right;
}

.document-info h1 {
  font-size: 22px;
  color: #1e3a5f;
  margin-bottom: 6px;
}

.document-info p {
  font-size: 11px;
  color: #667085;
  margin: 3px 0;
}

.document-client-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 22px;
}

.document-client-section > div {
  padding: 12px;
  background: #faf8f0;
  border-left: 4px solid #f5b700;
  border-radius: 6px;
}

.document-client-section span {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #dca500;
}

.document-client-section strong {
  display: block;
  margin: 6px 0 3px;
  color: #1d2939;
  font-size: 13px;
}

.document-client-section p {
  font-size: 11px;
  color: #667085;
  margin: 2px 0;
}

.document-items {
  border: 1px solid #e4e7ec;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 18px;
}

.document-table-header,
.document-item-row {
  display: grid;
  grid-template-columns:
    28px
    1fr
    48px
    50px
    100px
    105px;

  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  font-size: 11px;
}

.document-table-header {
  background: #1e3a5f;
  color: white;
  font-weight: 700;
  font-size: 10px;
}

.document-item-row {
  border-bottom: 1px solid #eaecf0;
  color: #475467;
}

.document-item-row:last-child {
  border-bottom: none;
}

.document-item-row span:nth-child(5),
.document-item-row span:nth-child(6) {
  text-align: right;
}

.document-item-row strong {
  display: block;
  font-size: 11px;
}

.document-item-row small {
  font-size: 10px;
  color: #98a2b3;
  display: block;
  margin-top: 2px;
}

.document-totals {
  width: 280px;
  margin-left: auto;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
}

.document-totals > div {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
  border-bottom: 1px solid #eaecf0;
  color: #667085;
}

.document-totals strong {
  color: #1d2939;
}

.document-totals .transport-desc {
  font-size: 10px;
  color: #98a2b3;
  font-weight: 400;
  display: block;
  margin-top: 1px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
}
thead th {
  background: #1f2937;
  color: #f5b700;
  font-size: 10px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 10px 8px;
  text-align: left;
}
thead th.right { text-align: right; }
tbody td {
  padding: 10px 8px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 11px;
  color: #374151;
  vertical-align: top;
}
tbody td.right { text-align: right; }
tbody td strong {
  display: block;
  color: #1f2937;
}
tbody td small {
  display: block;
  margin-top: 2px;
  color: #9ca3af;
  font-size: 10px;
}

.document-grand-total {
  margin-top: 4px;
  padding: 10px 12px !important;
  background: #1e3a5f;
  color: white !important;
  border-radius: 6px;
  border-bottom: none !important;
}

.document-grand-total strong {
  color: #f5b700 !important;
  font-size: 14px;
}

/* Keep terms + signatures + footer together.
   If they would split across pages, the whole
   block moves to the next page. */
.document-bottom {
  page-break-inside: avoid;
  break-inside: avoid;
  margin-top: 8px;
}

.document-terms {
  padding-top: 14px;
  border-top: 1px solid #e4e7ec;
}

.document-terms h4 {
  color: #1e3a5f;
  font-size: 11px;
  margin-bottom: 6px;
}

.document-terms p {
  font-size: 10px;
  line-height: 1.5;
  color: #667085;
  white-space: pre-line;
}

.document-signatures {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 28px;
}

.document-signatures > div {
  font-size: 11px;
  color: #667085;
}

.signature-line {
  height: 1px;
  background: #98a2b3;
  margin-bottom: 5px;
}

.document-footer {
  margin-top: 24px;
  padding-top: 10px;
  border-top: 1px solid #e4e7ec;
  text-align: center;
  font-size: 10px;
  color: #1e3a5f;
  font-weight: 700;
}
</style>
</head>
<body>
<div class="quotation-document">
  <div class="document-content">
    <div class="document-top">
      <div class="document-company">
        ${
          logoBase64
            ? `<img src="${logoBase64}" alt="Logo" />`
            : ""
        }
        <div>
          <h2>WAMARA</h2>
          <h3>CONTRACTORS</h3>
          <p>Electrical Installation | Solar | Maintenance</p>
          <p>wamaracontractors@gmail.com</p>
          <p>Kampala, Uganda · +256 782 696812</p>
        </div>
      </div>
      <div class="document-info">
        <h1>QUOTATION</h1>
        <p>
          Reference:
          <strong>${full.quotation_number}</strong>
        </p>
        <p>Date: ${formatDate(full.created_at)}</p>
        <p>
          Status:
          <strong>${full.status}</strong>
        </p>
      </div>
    </div>

    <div class="document-client-section">
      <div>
        <span>QUOTED TO</span>
        <strong>${full.client_name}</strong>
        ${
          full.client_phone
            ? `<p>${full.client_phone}</p>`
            : ""
        }
        ${
          full.client_email
            ? `<p>${full.client_email}</p>`
            : ""
        }
        ${
          full.client_location
            ? `<p>${full.client_location}</p>`
            : ""
        }
      </div>
      <div>
        <span>SUBJECT</span>
        <strong>${full.subject}</strong>
        ${
          full.description
            ? `<p style="margin-top:5px">${full.description}</p>`
            : ""
        }
      </div>
    </div>

    <table>
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th>Description</th>
        <th class="right" style="width:50px">Qty</th>
        <th style="width:50px">Unit</th>
        <th class="right" style="width:100px">Unit Price</th>
        <th class="right" style="width:110px">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${(full.items || [])
        .map(
          (item, i) => `
      <tr>
        <td>${String(i + 1).padStart(2, "0")}</td>
        <td>
          <strong>${item.item_name}</strong>
        </td>
        <td class="right">${item.quantity}</td>
        <td>${item.unit || "pcs"}</td>
        <td class="right">${formatCurrency(item.unit_price)}</td>
        <td class="right">${formatCurrency(item.total)}</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

    <div class="document-totals">
      <div>
        <span>Materials Subtotal</span>
        <strong>${formatCurrency(full.subtotal)}</strong>
      </div>
      ${
        Number(full.labour_cost) > 0
          ? `
      <div>
        <span>Labour / Installation</span>
        <strong>${formatCurrency(full.labour_cost)}</strong>
      </div>`
          : ""
      }
      ${
        Number(full.transport_cost) > 0
          ? `
      <div>
        <span>
          Transport
          ${
            full.transport_description
              ? `<small class="transport-desc">${full.transport_description}</small>`
              : ""
          }
        </span>
        <strong>${formatCurrency(full.transport_cost)}</strong>
      </div>`
          : ""
      }
      <div class="document-grand-total">
        <span>GRAND TOTAL</span>
        <strong>${formatCurrency(full.total)}</strong>
      </div>
    </div>
  </div>

  <div class="document-bottom">
    <div class="document-terms">
      <h4>TERMS & CONDITIONS</h4>
      <p>${full.terms || ""}</p>
    </div>

    <div class="document-signatures">
      <div>
        <div class="signature-line"></div>
        Prepared By
        <br/>
        <strong>Eng Tumusiime Benon James</strong>
        <br/>
        Wamara Contractors
      </div>
      <div>
        <div class="signature-line"></div>
        Client Approval
        <br/>
        <strong>Name & Signature</strong>
      </div>
    </div>

    <div class="document-footer">
      Thank you for choosing WAMARA CONTRACTORS · POWERING EVERY PROJECT · BUILDING TRUST
    </div>
  </div>
</div>
</body>
</html>
`;

      const filename =
        `${
          full.client_name
            ? full.client_name.replace(/[/\\?%*:|"<>]/g, "-")
            : "quotation"
        }-${formatDate(full.created_at) || "draft"}.pdf`;

      await window.electronAPI.printToPDF(
        html,
        filename
      );
    } catch (error: any) {
      console.error(error);

      alert(
        "Failed to generate PDF: " +
          (
            error?.message ||
            "Unknown error"
          )
      );
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="quotations-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="quotations-header">

        <div>

          <p className="page-eyebrow">
            SALES DOCUMENTS
          </p>

          <h1>
            Quotations
          </h1>

          <p className="page-description">
            Create professional electrical
            quotations and manage all your
            saved estimates.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={openCreateModal}
        >

          <Plus size={18} />

          New Quotation

        </button>

      </div>

      {/* =====================================
          STATS
      ===================================== */}

      <div className="quotation-stats">

        <div className="quotation-stat-card">

          <div className="quotation-stat-icon">

            <FileText size={22} />

          </div>

          <div>

            <span>
              Total Quotations
            </span>

            <strong>
              {stats.total}
            </strong>

          </div>

        </div>

        <div className="quotation-stat-card">

          <div className="quotation-stat-icon">

            <Clock size={22} />

          </div>

          <div>

            <span>
              Drafts
            </span>

            <strong>
              {stats.draft}
            </strong>

          </div>

        </div>

        <div className="quotation-stat-card">

          <div className="quotation-stat-icon">

            <Send size={22} />

          </div>

          <div>

            <span>
              Sent
            </span>

            <strong>
              {stats.sent}
            </strong>

          </div>

        </div>

        <div className="quotation-stat-card">

          <div className="quotation-stat-icon">

            <CheckCircle2 size={22} />

          </div>

          <div>

            <span>
              Approved
            </span>

            <strong>
              {stats.approved}
            </strong>

          </div>

        </div>

      </div>

      {/* =====================================
          QUOTATIONS LIST
      ===================================== */}

      <div className="quotations-card">


        <div className="quotations-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Search quotation or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="toolbar-right">
            <span className="quotations-count">
              {filteredQuotations.length}{" "}
              quotation{filteredQuotations.length !== 1 ? "s" : ""}
            </span>

            <div className="view-toggle">
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={viewMode === "detailed" ? "active" : ""}
                onClick={() => setViewMode("detailed")}
                title="Detailed cards"
              >
                <Rows3 size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="quotations-body">
          {isLoading ? (
            <div className="no-results">Loading quotations...</div>
          ) : filteredQuotations.length === 0 ? (
            <div className="no-results">No quotations found.</div>
          ) : viewMode === "list" ? (
            <div className="quotations-table-wrapper">
              <table className="quotations-table">
                <thead>
                  <tr>
                    <th>Quotation</th>
                    <th>Client</th>
                    <th>Subject</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotations.map((quotation) => (
                    <tr key={quotation.id} className="quotation-list-row">
                      <td>
                        <strong className="quotation-number">
                          {quotation.quotation_number}
                        </strong>
                      </td>
                      <td>
                        <div className="quotation-client">
                          <div className="quotation-avatar">
                            {quotation.client_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span>{quotation.client_name}</span>
                        </div>
                      </td>
                      <td>{quotation.subject}</td>
                      <td className="quotation-amount">
                        {formatCurrency(quotation.total)}
                      </td>
                      <td>
                        <span className={`status-badge status-${quotation.status?.toLowerCase()}`}>
                          {quotation.status}
                        </span>
                      </td>
                      <td>{formatDate(quotation.created_at)}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-button view-action"
                            title="View"
                            onClick={() => openViewer(quotation)}
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            className="action-button"
                            title="Edit"
                            onClick={() => openEditModal(quotation)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="action-button"
                            title="Download PDF"
                            onClick={() => downloadPDF(quotation)}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            className="action-button delete-action"
                            title="Delete"
                            onClick={() => handleDelete(quotation.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : viewMode === "grid" ? (
            <div className="quotations-grid">
              {filteredQuotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="quotation-grid-card"
                  onClick={() => openViewer(quotation)}
                >
                  <div className="quotation-grid-top">
                    <strong className="quotation-number">
                      {quotation.quotation_number}
                    </strong>
                    <span className={`status-badge status-${quotation.status?.toLowerCase()}`}>
                      {quotation.status}
                    </span>
                  </div>
                  <h3>{quotation.subject || "Untitled"}</h3>
                  <p>{quotation.client_name}</p>
                  <div className="quotation-grid-footer">
                    <strong>{formatCurrency(quotation.total)}</strong>
                    <span>{formatDate(quotation.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="quotations-detailed">
              {filteredQuotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="quotation-detailed-card"
                  onClick={() => openViewer(quotation)}
                >
                  <div className="quotation-detailed-top">
                    <div>
                      <strong className="quotation-number">
                        {quotation.quotation_number}
                      </strong>
                      <h3>{quotation.subject || "Untitled"}</h3>
                      <p>{quotation.client_name}</p>
                    </div>
                    <span className={`status-badge status-${quotation.status?.toLowerCase()}`}>
                      {quotation.status}
                    </span>
                  </div>
                  <div className="quotation-detailed-meta">
                    <span>Amount: <strong>{formatCurrency(quotation.total)}</strong></span>
                    <span>Date: {formatDate(quotation.created_at)}</span>
                  </div>
                  <div
                    className="table-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="action-button view-action"
                      onClick={() => openViewer(quotation)}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="action-button"
                      onClick={() => openEditModal(quotation)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="action-button"
                      onClick={() => downloadPDF(quotation)}
                    >
                      <Download size={16} />
                    </button>
                    <button
                      className="action-button delete-action"
                      onClick={() => handleDelete(quotation.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* =====================================
          QUOTATION EDITOR
      ===================================== */}

      {showEditor && createPortal(

        <div className="modal-overlay">

          <div className="quotation-modal">

            <div className="modal-header">

              <div>

                <p className="page-eyebrow">

                  {editingQuotation
                    ? "EDIT QUOTATION"
                    : "NEW QUOTATION"}

                </p>

                <h2>

                  {editingQuotation
                    ? "Edit Quotation"
                    : "Create Quotation"}

                </h2>

              </div>

              <button
                className="close-button"
                onClick={() => {
                  closeMaterialPicker();
                  setShowEditor(false);
                }}
              >

                <X size={20} />

              </button>

            </div>

            <div className="quotation-form">

              {/* =====================================
                  PROJECT SELECTION - AT THE TOP
              ===================================== */}

              <div className="project-select-section">

                <div className="project-select-header">
                  <Briefcase size={18} />
                  <strong>Link to Existing Project</strong>
                  <span>
                    Select a project to auto-fill client details and labour cost.
                  </span>
                </div>

                <div className="project-select-row">
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Select Project</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) =>
                        handleProjectSelect(
                          e.target.value
                            ? Number(e.target.value)
                            : ""
                        )
                      }
                      className="project-select-dropdown"
                    >
                      <option value="">Choose a project...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.client ? ` — ${p.client}` : ""}
                          {p.status ? ` (${p.status})` : ""}
                          {p.estimated_value ? ` — ${formatCurrency(p.estimated_value)}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Link Quotation to Project</label>
                    <label className="labour-toggle" style={{ marginTop: 6 }}>
                      <input
                        type="checkbox"
                        checked={linkToExistingProject}
                        onChange={(e) => {
                          setLinkToExistingProject(e.target.checked);
                          if (!e.target.checked) {
                            setSelectedProjectId("");
                          }
                        }}
                      />
                      <span className="labour-toggle-slider" />
                    </label>
                  </div>
                </div>

                {selectedProjectId && linkToExistingProject && (
                  <div className="project-auto-fill-info">
                    <CheckCircle2 size={16} />
                    <span>
                      Client details and labour cost have been auto-filled from
                      <strong> {projects.find((p) => p.id === Number(selectedProjectId))?.name || "project"}</strong>
                    </span>
                  </div>
                )}

                {projects.length === 0 && (
                  <small
                    style={{
                      color: "#6b7280",
                      fontSize: 12,
                      marginTop: 8,
                      display: "block",
                    }}
                  >
                    No projects found. Create a project first, or mark this
                    quotation as Sent to auto-create one.
                  </small>
                )}

              </div>

              {/* CLIENT DETAILS */}

              <div className="form-grid" style={{ marginTop: 20 }}>

                <div className="form-group">

                  <label>
                    Existing Client
                  </label>

                  <select
                    value={
                      form.client_id || ""
                    }
                    onChange={(e) =>
                      handleClientChange(
                        Number(
                          e.target.value
                        )
                      )
                    }
                  >

                    <option value="">
                      Select saved client
                    </option>

                    {clients.map(
                      (client) => (

                        <option
                          key={client.id}
                          value={client.id}
                        >

                          {client.name}

                        </option>

                      )
                    )}

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Quotation Number
                  </label>

                  <input
                    value={
                      form.quotation_number
                    }
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        quotation_number:
                          e.target.value,
                      }))
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Client Name
                  </label>

                  <input
                    value={form.client_name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        client_name:
                          e.target.value,
                      }))
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Phone
                  </label>

                  <input
                    value={
                      form.client_phone
                    }
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        client_phone:
                          e.target.value,
                      }))
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Email
                  </label>

                  <input
                    value={
                      form.client_email
                    }
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        client_email:
                          e.target.value,
                      }))
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Location
                  </label>

                  <input
                    value={
                      form.client_location
                    }
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        client_location:
                          e.target.value,
                      }))
                    }
                  />

                </div>

                <div className="form-group full-width">

                  <label>
                    Quotation Subject
                  </label>

                  <input
                    placeholder="Example: Electrical Installation for Residential House"
                    value={form.subject}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        subject:
                          e.target.value,
                      }))
                    }
                  />

                </div>

                <div className="form-group full-width">

                  <label>
                    Description
                  </label>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description:
                          e.target.value,
                      }))
                    }
                  />

                </div>

              </div>

              {/* =================================
                  MATERIALS & ITEMS
              ================================= */}

              <div className="items-section">

                <div className="section-title">

                  <div>

                    <h3>
                      Materials & Items
                    </h3>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        color: "#667085",
                      }}
                    >

                      Add materials directly from
                      your VoltDesk materials
                      database or enter a custom
                      item.

                    </p>

                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={openMaterialPicker}
                    >

                      <Database size={16} />

                      Search Materials

                    </button>

                    <button
                      type="button"
                      className="add-item-button"
                      onClick={addItem}
                    >

                      <Plus size={16} />

                      Add Item

                    </button>

                  </div>

                </div>

                {/* ITEMS TABLE */}

                <div className="quotations-table-wrapper">

                  <table className="items-table">

                    <thead>

                      <tr>

                        <th>
                          Item
                        </th>

                        <th>
                          Description
                        </th>

                        <th>
                          Qty
                        </th>

                        <th>
                          Unit
                        </th>

                        <th>
                          Unit Price
                        </th>

                        <th>
                          Total
                        </th>

                        <th />

                      </tr>

                    </thead>

                    <tbody>

                      {form.items.map(
                        (
                          item,
                          index
                        ) => (

                          <tr
                            key={index}
                          >

                            <td>

                              <input
                                placeholder="Material or service"
                                value={
                                  item.item_name
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "item_name",
                                    e.target.value
                                  )
                                }
                              />

                            </td>

                            <td>

                              <input
                                placeholder="Optional details"
                                value={
                                  item.description
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "description",
                                    e.target.value
                                  )
                                }
                              />

                            </td>

                            <td>

                              <input
                                type="number"
                                min="0"
                                value={
                                  item.quantity
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "quantity",
                                    Number(
                                      e.target.value
                                    )
                                  )
                                }
                              />

                            </td>

                            <td>

                              <input
                                placeholder="pcs"
                                value={
                                  item.unit
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "unit",
                                    e.target.value
                                  )
                                }
                              />

                            </td>

                            <td>

                              <input
                                type="number"
                                min="0"
                                value={
                                  item.unit_price
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "unit_price",
                                    Number(
                                      e.target.value
                                    )
                                  )
                                }
                              />

                            </td>

                            <td>

                              {formatCurrency(
                                (
                                  Number(
                                    item.quantity
                                  ) || 0
                                ) *
                                  (
                                    Number(
                                      item.unit_price
                                    ) || 0
                                  )
                              )}

                            </td>

                            <td>

                              <button
                                type="button"
                                className="item-remove-button"
                                onClick={() =>
                                  removeItem(
                                    index
                                  )
                                }
                                title="Remove item"
                              >

                                <Trash2
                                  size={17}
                                />

                              </button>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

                {/* ADD ITEM BELOW TABLE */}

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 16,
                    flexWrap: "wrap",
                  }}
                >

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={openMaterialPicker}
                  >

                    <Package size={17} />

                    Add from Materials Database

                  </button>

                  <button
                    type="button"
                    className="add-item-button"
                    onClick={addItem}
                  >

                    <Plus size={17} />

                    Add Another Item

                  </button>

                </div>

              </div>

              {/* LABOUR */}

              <div className="labour-option">

                <div className="labour-option-info">

                  <strong>
                    Include Labour Cost
                  </strong>

                  <span>

                    Labour is automatically set
                    to 37% of materials. You can
                    still adjust it.

                  </span>

                </div>

                <label className="labour-toggle">

                  <input
                    type="checkbox"
                    checked={
                      includeLabour
                    }
                    onChange={(e) => {
                      const checked =
                        e.target.checked;

                      setIncludeLabour(
                        checked
                      );

                      if (checked) {
                        setLabourCost(
                          Math.round(
                            subtotal * 0.37
                          )
                        );
                      } else {
                        setLabourCost(0);
                      }
                    }}
                  />

                  <span className="labour-toggle-slider" />

                </label>

              </div>

              {includeLabour && (

                <div className="form-group">

                  <label>
                    Labour Cost (UGX)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={labourCost}
                    onChange={(e) =>
                      setLabourCost(
                        Number(
                          e.target.value
                        ) || 0
                      )
                    }
                  />

                  <small
                    style={{
                      color: "#6b7280",
                      fontSize: 12,
                      marginTop: 4,
                      display: "block",
                    }}
                  >

                    Suggested:

                    {" "}

                    {formatCurrency(
                      suggestedLabour
                    )}

                    {" "}

                    (37% of materials)

                  </small>

                </div>

              )}

              {/* TRANSPORT */}

              <div className="labour-option">

                <div className="labour-option-info">

                  <strong>
                    Include Transport Cost
                  </strong>

                  <span>

                    Add transport or delivery
                    charges for this quotation.
                    Description is optional.

                  </span>

                </div>

                <label className="labour-toggle">

                  <input
                    type="checkbox"
                    checked={
                      includeTransport
                    }
                    onChange={(e) => {
                      const checked =
                        e.target.checked;

                      setIncludeTransport(
                        checked
                      );

                      if (!checked) {
                        setTransportCost(0);
                        setTransportDescription("");
                      }
                    }}
                  />

                  <span className="labour-toggle-slider" />

                </label>

              </div>

              {includeTransport && (

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1.4fr",
                    gap: 16,
                    marginBottom: 8,
                  }}
                >

                  <div className="form-group">

                    <label>
                      Transport Cost (UGX)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={transportCost}
                      onChange={(e) =>
                        setTransportCost(
                          Number(
                            e.target.value
                          ) || 0
                        )
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Transport Description
                      (optional)
                    </label>

                    <input
                      placeholder="e.g. Delivery to site, fuel, etc."
                      value={transportDescription}
                      onChange={(e) =>
                        setTransportDescription(
                          e.target.value
                        )
                      }
                    />

                  </div>

                </div>

              )}

              {/* TERMS */}

              <div className="form-group full-width">

                <label>
                  Terms & Conditions
                </label>

                <textarea
                  value={form.terms}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      terms:
                        e.target.value,
                    }))
                  }
                />

              </div>

              {/* TOTALS */}

              <div className="quote-totals">

                <div className="total-row">

                  <span>
                    Materials Subtotal
                  </span>

                  <strong>

                    {formatCurrency(
                      subtotal
                    )}

                  </strong>

                </div>

                {includeLabour && (

                  <div className="total-row labour-total-row">

                    <span>
                      Labour
                    </span>

                    <strong>

                      {formatCurrency(
                        actualLabourCost
                      )}

                    </strong>

                  </div>

                )}

                {includeTransport && (

                  <div className="total-row labour-total-row">

                    <span>
                      Transport
                      {transportDescription.trim() && (
                        <small
                          style={{
                            display: "block",
                            fontWeight: 400,
                            color: "#667085",
                            fontSize: 12,
                          }}
                        >
                          {transportDescription}
                        </small>
                      )}
                    </span>

                    <strong>

                      {formatCurrency(
                        actualTransportCost
                      )}

                    </strong>

                  </div>

                )}

                <div className="total-row grand-total">

                  <span>
                    Total
                  </span>

                  <span>

                    {formatCurrency(
                      grandTotal
                    )}

                  </span>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    closeMaterialPicker();
                    setShowEditor(false);
                  }}
                  disabled={isSaving}
                >

                  Cancel

                </button>

                <button
                  type="button"
                  className="primary-button"
                  disabled={isSaving}
                  onClick={() =>
                    handleSave("Draft")
                  }
                >

                  {isSaving
                    ? "Saving..."
                    : "Save Draft"}

                </button>

                <button
                  type="button"
                  className="download-button"
                  disabled={isSaving}
                  onClick={() =>
                    handleSave("Sent")
                  }
                >

                  <Send size={17} />

                  {isSaving
                    ? "Saving..."
                    : "Save & Mark Sent"}

                </button>

              </div>

            </div>

          </div>

        </div>

      , document.body)}

      {/* =====================================
          MATERIAL PICKER MODAL
      ===================================== */}

      {showMaterialPicker && createPortal(

        <div
          className="modal-overlay"
          style={{ zIndex: 10000 }}
          onClick={closeMaterialPicker}
        >

          <div
            className="material-picker-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <p className="page-eyebrow">
                  MATERIALS DATABASE
                </p>

                <h2>
                  Add Material to Quotation
                </h2>

                <p
                  style={{
                    marginTop: 5,
                    color: "#667085",
                    fontSize: 13,
                  }}
                >

                  Search your saved materials and
                  automatically use their current
                  prices and units.

                </p>

              </div>

              <button
                className="close-button"
                onClick={closeMaterialPicker}
              >

                <X size={20} />

              </button>

            </div>

            {!showCustomItem ? (

              <>

                {/* SEARCH */}

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 18,
                    flexWrap: "wrap",
                  }}
                >

                  <div
                    className="search-box"
                    style={{
                      flex: 1,
                      minWidth: 220,
                    }}
                  >

                    <Search size={18} />

                    <input
                      autoFocus
                      placeholder="Search material, brand, supplier or category..."
                      value={materialSearch}
                      onChange={(e) =>
                        setMaterialSearch(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <select
                    className="category-filter"
                    value={
                      materialCategory
                    }
                    onChange={(e) =>
                      setMaterialCategory(
                        e.target.value
                      )
                    }
                  >

                    {materialCategories.map(
                      (category) => (

                        <option
                          key={category}
                          value={category}
                        >

                          {category}

                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* MATERIAL LIST */}

                <div
                  className="material-picker-list"
                  style={{
                    maxHeight: 360,
                    overflowY: "auto",
                    border:
                      "1px solid #e4e7ec",
                    borderRadius: 10,
                  }}
                >

                  {filteredMaterials.length === 0 ? (

                    <div
                      style={{
                        padding: 32,
                        textAlign: "center",
                      }}
                    >

                      <Package
                        size={34}
                      />

                      <h3
                        style={{
                          marginTop: 10,
                        }}
                      >

                        No material found

                      </h3>

                      <p
                        style={{
                          color: "#667085",
                          marginTop: 6,
                        }}
                      >

                        This item does not appear
                        in your materials database.

                      </p>

                      <button
                        type="button"
                        className="primary-button"
                        style={{
                          marginTop: 16,
                        }}
                        onClick={
                          startCustomItem
                        }
                      >

                        <Plus size={17} />

                        Add Custom Item

                      </button>

                    </div>

                  ) : (

                    filteredMaterials.map(
                      (material) => {

                        const isSelected =
                          selectedMaterial?.id ===
                          material.id;

                        return (

                          <button
                            type="button"
                            key={material.id}
                            onClick={() =>
                              selectMaterial(
                                material
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              borderBottom:
                                "1px solid #eaecf0",
                              background:
                                isSelected
                                  ? "#f8fafc"
                                  : "white",
                              padding: 16,
                              cursor: "pointer",
                              textAlign: "left",
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
                              gap: 16,
                            }}
                          >

                            <div>

                              <strong
                                style={{
                                  display:
                                    "block",
                                  color:
                                    "#1d2939",
                                }}
                              >

                                {material.name}

                              </strong>

                              <span
                                style={{
                                  display:
                                    "block",
                                  marginTop: 4,
                                  fontSize: 12,
                                  color:
                                    "#667085",
                                }}
                              >

                                {
                                  material.category
                                }

                                {" • "}

                                {
                                  material.unit ||
                                  "pcs"
                                }

                                {material.supplier
                                  ? ` • ${material.supplier}`
                                  : ""}

                              </span>

                            </div>

                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: 10,
                              }}
                            >

                              <strong
                                style={{
                                  color:
                                    "#1e3a5f",
                                }}
                              >

                                {formatCurrency(
                                  material.price
                                )}

                              </strong>

                              <ChevronRight
                                size={18}
                              />

                            </div>

                          </button>

                        );
                      }
                    )

                  )}

                </div>

                {/* SELECTED MATERIAL */}

                {selectedMaterial && (

                  <div
                    style={{
                      marginTop: 18,
                      padding: 16,
                      borderRadius: 10,
                      background:
                        "#faf8f0",
                      border:
                        "1px solid #f0df9d",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >

                      <div>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color:
                              "#b38600",
                            letterSpacing:
                              1,
                          }}
                        >

                          SELECTED MATERIAL

                        </span>

                        <h3
                          style={{
                            marginTop: 5,
                          }}
                        >

                          {
                            selectedMaterial.name
                          }

                        </h3>

                        <p
                          style={{
                            color:
                              "#667085",
                            marginTop: 4,
                            fontSize: 13,
                          }}
                        >

                          Unit:

                          {" "}

                          <strong>

                            {
                              selectedMaterial.unit ||
                              "pcs"
                            }

                          </strong>

                          {" • "}

                          Price:

                          {" "}

                          <strong>

                            {formatCurrency(
                              selectedMaterial.price
                            )}

                          </strong>

                        </p>

                      </div>

                      <div
                        style={{
                          minWidth: 140,
                        }}
                      >

                        <label
                          style={{
                            display:
                              "block",
                            fontSize: 12,
                            marginBottom: 6,
                          }}
                        >

                          Quantity

                        </label>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: 8,
                          }}
                        >

                          <button
                            type="button"
                            className="table-action"
                            onClick={() =>
                              setMaterialQuantity(
                                (current) =>
                                  Math.max(
                                    1,
                                    current - 1
                                  )
                              )
                            }
                          >

                            <Minus
                              size={16}
                            />

                          </button>

                          <input
                            type="number"
                            min="1"
                            value={
                              materialQuantity
                            }
                            onChange={(e) =>
                              setMaterialQuantity(
                                Math.max(
                                  1,
                                  Number(
                                    e.target.value
                                  ) || 1
                                )
                              )
                            }
                            style={{
                              width: 65,
                              textAlign:
                                "center",
                            }}
                          />

                          <button
                            type="button"
                            className="table-action"
                            onClick={() =>
                              setMaterialQuantity(
                                (current) =>
                                  current + 1
                              )
                            }
                          >

                            <Plus
                              size={16}
                            />

                          </button>

                        </div>

                      </div>

                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >

                      <span
                        style={{
                          fontSize: 13,
                          color:
                            "#475467",
                        }}
                      >

                        Item total:

                        {" "}

                        <strong>

                          {formatCurrency(
                            (
                              Number(
                                selectedMaterial.price
                              ) || 0
                            ) *
                              materialQuantity
                          )}

                        </strong>

                      </span>

                      <button
                        type="button"
                        className="primary-button"
                        onClick={
                          addSelectedMaterial
                        }
                      >

                        <Plus size={17} />

                        Add to Quotation

                      </button>

                    </div>

                  </div>

                )}

                {/* CUSTOM ITEM */}

                <div
                  style={{
                    marginTop: 18,
                    textAlign: "center",
                  }}
                >

                  <span
                    style={{
                      color: "#667085",
                      fontSize: 13,
                    }}
                  >

                    Can't find what you're looking
                    for?

                  </span>

                  <button
                    type="button"
                    className="secondary-button"
                    style={{
                      marginLeft: 10,
                    }}
                    onClick={
                      startCustomItem
                    }
                  >

                    <Plus size={16} />

                    Add Custom Item

                  </button>

                </div>

              </>

            ) : (

              /* CUSTOM ITEM VIEW */

              <div>

                <div
                  style={{
                    padding: 14,
                    background:
                      "#f8fafc",
                    borderRadius: 8,
                    marginBottom: 18,
                    fontSize: 13,
                    color:
                      "#475467",
                  }}
                >

                  This item is not currently in
                  your materials database. Enter
                  it manually below. It will be
                  saved to the database when you
                  save the quotation.

                </div>

                <div className="form-grid">

                  <div className="form-group full-width">

                    <label>
                      Item Name
                    </label>

                    <input
                      autoFocus
                      placeholder="e.g. Electrical installation service"
                      value={
                        form.items[
                          form.items.length - 1
                        ]?.item_name || ""
                      }
                      onChange={(e) => {
                        const index =
                          form.items.length - 1;

                        updateItem(
                          index,
                          "item_name",
                          e.target.value
                        );
                      }}
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        form.items[
                          form.items.length - 1
                        ]?.quantity || 1
                      }
                      onChange={(e) => {
                        const index =
                          form.items.length - 1;

                        updateItem(
                          index,
                          "quantity",
                          Number(
                            e.target.value
                          )
                        );
                      }}
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Unit
                    </label>

                    <input
                      placeholder="pcs"
                      value={
                        form.items[
                          form.items.length - 1
                        ]?.unit || "pcs"
                      }
                      onChange={(e) => {
                        const index =
                          form.items.length - 1;

                        updateItem(
                          index,
                          "unit",
                          e.target.value
                        );
                      }}
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Unit Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.items[
                          form.items.length - 1
                        ]?.unit_price || 0
                      }
                      onChange={(e) => {
                        const index =
                          form.items.length - 1;

                        updateItem(
                          index,
                          "unit_price",
                          Number(
                            e.target.value
                          )
                        );
                      }}
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Description
                    </label>

                    <input
                      placeholder="Optional"
                      value={
                        form.items[
                          form.items.length - 1
                        ]?.description || ""
                      }
                      onChange={(e) => {
                        const index =
                          form.items.length - 1;

                        updateItem(
                          index,
                          "description",
                          e.target.value
                        );
                      }}
                    />

                  </div>

                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    marginTop: 20,
                    gap: 12,
                  }}
                >

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setShowCustomItem(false)
                    }
                  >

                    Back to Search

                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      closeMaterialPicker();
                    }}
                  >

                    Add Custom Item

                  </button>

                </div>

              </div>

            )}

          </div>

        </div>

      , document.body)}

      {/* =====================================
          VIEWER
      ===================================== */}

      {showViewer &&
        viewingQuotation && createPortal(

          <div className="modal-overlay quotation-viewer-overlay">

            <div className="quotation-viewer-modal">

              <div className="quotation-viewer-header">

                <div>

                  <span className="viewer-reference">

                    {
                      viewingQuotation.quotation_number
                    }

                  </span>

                  <h2>
                    Quotation Preview
                  </h2>

                </div>

                <button
                  className="close-button"
                  onClick={() =>
                    setShowViewer(false)
                  }
                >

                  <X size={20} />

                </button>

              </div>

              <div className="quotation-viewer-body">

                <div
                  className="quotation-document"
                  id="printable-quotation"
                >

                  <div className="document-top">

                    <div className="document-company">

                      <img
                        src={logo}
                        alt="Wamara Contractors Logo"
                      />

                      <div>

                        <h2>
                          WAMARA
                        </h2>

                        <h3>
                          CONTRACTORS
                        </h3>

                        <p>
                          Electrical Installation |
                          Solar |
                          Maintenance
                        </p>

                        <p>
                          wamaracontractors@gmail.com
                        </p>

                        <p
                          style={{
                            fontSize: 11,
                            marginTop: 4,
                          }}
                        >

                          Kampala, Uganda ·
                          +256 782 696812

                        </p>

                      </div>

                    </div>

                    <div className="document-info">

                      <h1>
                        QUOTATION
                      </h1>

                      <p>

                        Reference:

                        {" "}

                        <strong>

                          {
                            viewingQuotation
                              .quotation_number
                          }

                        </strong>

                      </p>

                      <p>

                        Date:

                        {" "}

                        {formatDate(
                          viewingQuotation
                            .created_at
                        )}

                      </p>

                      <p>

                        Status:

                        {" "}

                        <strong>

                          {
                            viewingQuotation
                              .status
                          }

                        </strong>

                      </p>

                    </div>

                  </div>

                  <div className="document-client-section">

                    <div>

                      <span>
                        QUOTED TO
                      </span>

                      <strong>

                        {
                          viewingQuotation
                            .client_name
                        }

                      </strong>

                      {viewingQuotation
                        .client_phone && (

                        <p>

                          {
                            viewingQuotation
                              .client_phone
                          }

                        </p>

                      )}

                      {viewingQuotation
                        .client_email && (

                        <p>

                          {
                            viewingQuotation
                              .client_email
                          }

                        </p>

                      )}

                      {viewingQuotation
                        .client_location && (

                        <p>

                          {
                            viewingQuotation
                              .client_location
                          }

                        </p>

                      )}

                    </div>

                    <div>

                      <span>
                        SUBJECT
                      </span>

                      <strong
                        style={{
                          fontSize: 15,
                        }}
                      >

                        {
                          viewingQuotation
                            .subject
                        }

                      </strong>

                      {viewingQuotation
                        .description && (

                        <p
                          style={{
                            marginTop: 8,
                          }}
                        >

                          {
                            viewingQuotation
                              .description
                          }

                        </p>

                      )}

                    </div>

                  </div>

                  <div className="document-items">

                    <div className="document-table-header">

                      <span>#</span>

                      <span>
                        Item / Description
                      </span>

                      <span>
                        Qty
                      </span>

                      <span>
                        Unit
                      </span>

                      <span>
                        Unit Price
                      </span>

                      <span>
                        Total
                      </span>

                    </div>

                    {viewingQuotation.items?.map(
                      (
                        item,
                        index
                      ) => (

                        <div
                          className="document-item-row"
                          key={
                            item.id ||
                            index
                          }
                        >

                          <span>

                            {index + 1}

                          </span>

                          <span>

                            <strong>

                              {
                                item.item_name
                              }

                            </strong>

                            {item.description && (

                              <small>

                                {
                                  item.description
                                }

                              </small>

                            )}

                          </span>

                          <span>

                            {
                              item.quantity
                            }

                          </span>

                          <span>

                            {
                              item.unit ||
                              "pcs"
                            }

                          </span>

                          <span>

                            {formatCurrency(
                              item.unit_price
                            )}

                          </span>

                          <span>

                            {formatCurrency(
                              item.total
                            )}

                          </span>

                        </div>

                      )
                    )}

                  </div>

                  <div className="document-totals">

                    <div>

                      <span>
                        Materials Subtotal
                      </span>

                      <strong>

                        {formatCurrency(
                          viewingQuotation
                            .subtotal
                        )}

                      </strong>

                    </div>

                    {Number(
                      viewingQuotation.labour_cost
                    ) > 0 && (

                      <div>

                        <span>
                          Labour / Installation
                        </span>

                        <strong>

                          {formatCurrency(
                            viewingQuotation
                              .labour_cost
                          )}

                        </strong>

                      </div>

                    )}

                    {Number(
                      viewingQuotation.transport_cost
                    ) > 0 && (

                      <div>

                        <span>
                          Transport
                          {viewingQuotation.transport_description && (
                            <small
                              style={{
                                display: "block",
                                fontWeight: 400,
                                color: "#98a2b3",
                                fontSize: 11,
                              }}
                            >
                              {
                                viewingQuotation
                                  .transport_description
                              }
                            </small>
                          )}
                        </span>

                        <strong>

                          {formatCurrency(
                            viewingQuotation
                              .transport_cost
                          )}

                        </strong>

                      </div>

                    )}

                    <div className="document-grand-total">

                      <span>
                        GRAND TOTAL
                      </span>

                      <strong>

                        {formatCurrency(
                          viewingQuotation.total
                        )}

                      </strong>

                    </div>

                  </div>

                  <div
                    className="document-bottom"
                    style={{
                      pageBreakInside: "avoid",
                      breakInside: "avoid",
                    }}
                  >

                    <div className="document-terms">

                      <h4>
                        TERMS & CONDITIONS
                      </h4>

                      <p>

                        {
                          viewingQuotation
                            .terms
                        }

                      </p>

                    </div>

                    <div className="document-signatures">

                      <div>

                        <div className="signature-line" />

                        Prepared By

                        <br />

                        <strong>
                          Eng Tumusiime Benon James
                        </strong>

                        <p>
                          Wamara Contractors
                        </p>

                      </div>

                      <div>

                        <div className="signature-line" />

                        Client Approval

                        <br />

                        <strong>
                          Name & Signature
                        </strong>

                      </div>

                    </div>

                    <div className="document-footer">

                      Thank you for choosing
                      WAMARA CONTRACTORS · POWERING EVERY PROJECT · BUILDING TRUST

                    </div>

                  </div>

                </div>

              </div>

              <div className="quotation-modal-footer">

                <button
                  className="modal-footer-button cancel-modal-button"
                  onClick={() =>
                    setShowViewer(false)
                  }
                >

                  Close

                </button>

                <div className="modal-footer-right">

                  <button
                    className="modal-footer-button edit-modal-button"
                    onClick={() => {
                      setShowViewer(false);

                      openEditModal(
                        viewingQuotation
                      );
                    }}
                  >

                    <Pencil size={16} />

                    Edit

                  </button>

                  <button
                    className="modal-footer-button print-modal-button"
                    onClick={handlePrint}
                  >

                    <Printer size={16} />

                    Print

                  </button>

                  <button
                    className="modal-footer-button download-modal-button"
                    onClick={() =>
                      downloadPDF(
                        viewingQuotation
                      )
                    }
                  >

                    <Download size={16} />

                    Save PDF

                  </button>

                </div>

              </div>

            </div>

          </div>

        , document.body)}

    </div>
  );
}