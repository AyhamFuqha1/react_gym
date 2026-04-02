import { useEffect, useMemo, useState } from "react";
import {
  Newspaper,
  FileText,
  Trash2,
  Plus,
  Calendar,
  Loader2,
  User,
  Eye,
  RotateCcw,
  Send,
  Pencil,
  Clock3,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  createNews,
  deleteNews,
  getNews,
  getNewsById,
  getNewsStats,
  updateNews,
  type NewsItem,
} from "../../services/news";

const statusColors: Record<string, string> = {
  public: "bg-emerald-50 text-emerald-600 border-emerald-100",
  draft: "bg-gray-100 text-gray-500 border-gray-200",
  deleted: "bg-red-50 text-red-500 border-red-100",
  expired: "bg-amber-50 text-amber-600 border-amber-100",
};

type FilterStatus = "all" | "public" | "draft" | "expired" | "deleted";
type SortOrder = "newest" | "oldest";

type BackendPaginationState = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
};

const LOCAL_FILTER_PAGE_SIZE = 10;

function getExcerpt(content: string, maxLength = 90) {
  if (!content) return "";
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength)}...`;
}

function getStoredUserId() {
  const raw =
    localStorage.getItem("user_id") || sessionStorage.getItem("user_id");

  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

function getNewsIcon(status: string) {
  if (status === "public") {
    return <Newspaper size={20} className="text-[#0D7D6D]" />;
  }

  if (status === "draft") {
    return <FileText size={20} className="text-blue-500" />;
  }

  return <Trash2 size={20} className="text-red-500" />;
}

function getDateValue(date?: string | null) {
  if (!date) return 0;
  const time = new Date(date).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDisplayDateTime(value?: string | null) {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getExpiryTime(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function isNewsExpired(item: NewsItem | null) {
  if (!item) return false;

  if (item.status === "deleted") return false;
  if (item.is_expired) return true;

  const expiryTime = getExpiryTime(item.expires_at);
  if (expiryTime == null) return false;

  return expiryTime <= Date.now();
}

function getRemainingLabel(item: NewsItem | null) {
  if (!item) return "No expiry";
  if (item.status === "deleted") return "In trash";

  const expiryTime = getExpiryTime(item.expires_at);
  if (expiryTime == null) return "No expiry";

  const diffMs = expiryTime - Date.now();

  if (diffMs <= 0) return "Expired";

  const totalMinutes = Math.ceil(diffMs / (1000 * 60));
  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (totalMinutes < 60) {
    return `${totalMinutes} minute(s) left`;
  }

  if (totalHours < 24) {
    return `${totalHours} hour(s) left`;
  }

  return `${totalDays} day(s) left`;
}

function getDisplayStatus(item: NewsItem | null) {
  if (!item) return "unknown";
  if (item.status === "deleted") return "deleted";
  if (isNewsExpired(item)) return "expired";
  return item.status;
}

export function NewsManagement() {
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingPublic, setSubmittingPublic] = useState(false);
  const [submittingDraft, setSubmittingDraft] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // بيانات الصفحة الحالية من الباك (لـ All)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  // جميع الأخبار محليًا (للفلاتر الأخرى)
  const [allNewsItems, setAllNewsItems] = useState<NewsItem[]>([]);

  const [stats, setStats] = useState({
    published: 0,
    drafts: 0,
    total_views: 0,
  });

  const [backendPagination, setBackendPagination] = useState<BackendPaginationState>({
    current_page: 1,
    from: null,
    last_page: 1,
    per_page: 10,
    to: null,
    total: 0,
    next_page_url: null,
    prev_page_url: null,
  });

  const [localFilteredPage, setLocalFilteredPage] = useState(1);

  const [form, setForm] = useState({
    title: "",
    content: "",
    expires_at: "",
  });

  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    expires_at: "",
  });

  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditingNews, setIsEditingNews] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadBackendPage(page = 1) {
    const newsResponse = await getNews(page, 10);
    const pageData = newsResponse.data;

    setNewsItems(pageData?.data ?? []);
    setBackendPagination({
      current_page: pageData?.current_page ?? 1,
      from: pageData?.from ?? null,
      last_page: pageData?.last_page ?? 1,
      per_page: pageData?.per_page ?? 10,
      to: pageData?.to ?? null,
      total: pageData?.total ?? 0,
      next_page_url: pageData?.next_page_url ?? null,
      prev_page_url: pageData?.prev_page_url ?? null,
    });
  }

  async function loadAllNewsForFilters() {
    const firstResponse = await getNews(1, 10);
    const firstPageData = firstResponse.data;

    const combined = [...(firstPageData?.data ?? [])];
    const lastPage = firstPageData?.last_page ?? 1;

    if (lastPage > 1) {
      const requests: Promise<ReturnType<typeof getNews>>[] = [];
      for (let page = 2; page <= lastPage; page += 1) {
        requests.push(getNews(page, 10));
      }

      const remainingResponses = await Promise.all(requests);
      remainingResponses.forEach((response) => {
        combined.push(...(response.data?.data ?? []));
      });
    }

    setAllNewsItems(combined);
  }

  async function loadPageData(page = 1) {
    setLoading(true);

    try {
      const [statsResponse] = await Promise.all([getNewsStats()]);

      await Promise.all([loadBackendPage(page), loadAllNewsForFilters()]);

      setStats(
        statsResponse.data ?? {
          published: 0,
          drafts: 0,
          total_views: 0,
        }
      );
    } catch (error) {
      console.error("Failed to load news data:", error);
      alert("Failed to load news data.");
      setNewsItems([]);
      setAllNewsItems([]);
      setStats({
        published: 0,
        drafts: 0,
        total_views: 0,
      });
      setBackendPagination({
        current_page: 1,
        from: null,
        last_page: 1,
        per_page: 10,
        to: null,
        total: 0,
        next_page_url: null,
        prev_page_url: null,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData(1);
  }, []);

  const dashboardStats = useMemo(
    () => [
      {
        label: "Published",
        value: String(stats.published),
        icon: Newspaper,
        color: "text-[#0D7D6D]",
        bg: "bg-[#E6F4F1]",
      },
      {
        label: "Drafts",
        value: String(stats.drafts),
        icon: FileText,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "Trash",
        value: String(stats.total_views),
        icon: Trash2,
        color: "text-red-500",
        bg: "bg-red-50",
      },
    ],
    [stats]
  );

  // فلترة جميع الأخبار محليًا للفلاتر غير All
  const fullyFilteredItems = useMemo(() => {
    const source = filterStatus === "all" ? newsItems : allNewsItems;

    const filteredItems = source.filter((item) => {
      const expired = isNewsExpired(item);

      if (filterStatus === "all") {
        return item.status !== "deleted";
      }

      if (filterStatus === "public") {
        return item.status === "public" && !expired;
      }

      if (filterStatus === "draft") {
        return item.status === "draft" && !expired;
      }

      if (filterStatus === "expired") {
        return item.status !== "deleted" && expired;
      }

      if (filterStatus === "deleted") {
        return item.status === "deleted";
      }

      return true;
    });

    return [...filteredItems].sort((a, b) => {
      const dateA = getDateValue(a.published_at || a.formatted_date);
      const dateB = getDateValue(b.published_at || b.formatted_date);

      if (sortOrder === "newest") {
        return dateB - dateA;
      }

      return dateA - dateB;
    });
  }, [filterStatus, sortOrder, newsItems, allNewsItems]);

  // العناصر المعروضة فعلًا
  const visibleNewsItems = useMemo(() => {
    if (filterStatus === "all") {
      return fullyFilteredItems;
    }

    const start = (localFilteredPage - 1) * LOCAL_FILTER_PAGE_SIZE;
    const end = start + LOCAL_FILTER_PAGE_SIZE;
    return fullyFilteredItems.slice(start, end);
  }, [filterStatus, fullyFilteredItems, localFilteredPage]);

  const localPaginationInfo = useMemo(() => {
    const total = fullyFilteredItems.length;
    const lastPage = Math.max(1, Math.ceil(total / LOCAL_FILTER_PAGE_SIZE));
    const currentPage = Math.min(localFilteredPage, lastPage);

    if (total === 0) {
      return {
        current_page: 1,
        last_page: 1,
        from: null,
        to: null,
        total: 0,
        hasPrev: false,
        hasNext: false,
      };
    }

    const from = (currentPage - 1) * LOCAL_FILTER_PAGE_SIZE + 1;
    const to = Math.min(currentPage * LOCAL_FILTER_PAGE_SIZE, total);

    return {
      current_page: currentPage,
      last_page: lastPage,
      from,
      to,
      total,
      hasPrev: currentPage > 1,
      hasNext: currentPage < lastPage,
    };
  }, [fullyFilteredItems, localFilteredPage]);

  useEffect(() => {
    setLocalFilteredPage(1);
  }, [filterStatus, sortOrder]);

  function resetForm() {
    setForm({
      title: "",
      content: "",
      expires_at: "",
    });
  }

  function toApiDateTime(value?: string) {
    if (!value) return null;
    return `${value.replace("T", " ")}:00`;
  }

  async function handleCreate(status: "public" | "draft") {
    if (!form.title.trim() || !form.content.trim()) {
      alert("Title and content are required.");
      return;
    }

    const userId = getStoredUserId();

    if (!userId) {
      alert("User ID not found. Please login again.");
      return;
    }

    try {
      if (status === "public") {
        setSubmittingPublic(true);
      } else {
        setSubmittingDraft(true);
      }

      await createNews({
        user_id: userId,
        title: form.title.trim(),
        content: form.content.trim(),
        status,
        expires_at: toApiDateTime(form.expires_at) ?? null,
      });

      resetForm();
      setIsAddingNews(false);
      setFilterStatus("all");
      setLocalFilteredPage(1);
      await loadPageData(1);
    } catch (error) {
      console.error("Failed to create news:", error);
      alert("Failed to create news.");
    } finally {
      setSubmittingPublic(false);
      setSubmittingDraft(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to move this news item to trash?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      await deleteNews(id);

      const nextPage =
        filterStatus === "all" &&
        newsItems.length === 1 &&
        backendPagination.current_page > 1
          ? backendPagination.current_page - 1
          : backendPagination.current_page;

      await loadPageData(nextPage);

      if (selectedNews?.id === id) {
        setIsViewOpen(false);
        setSelectedNews(null);
      }
    } catch (error) {
      console.error("Failed to delete news:", error);
      alert("Failed to delete news.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleOpenNews(item: NewsItem) {
    try {
      setIsViewOpen(true);
      setViewLoading(true);

      const response = await getNewsById(item.id);
      setSelectedNews(response.data);
    } catch (error) {
      console.error("Failed to load full news:", error);
      alert("Failed to load full news details.");
      setIsViewOpen(false);
      setSelectedNews(null);
    } finally {
      setViewLoading(false);
    }
  }

  async function handlePublish(id: number) {
    try {
      setPublishingId(id);
      await updateNews(id, { status: "public" });
      await loadPageData(backendPagination.current_page);

      if (selectedNews?.id === id) {
        const refreshed = await getNewsById(id);
        setSelectedNews(refreshed.data);
      }
    } catch (error) {
      console.error("Failed to publish news:", error);
      alert("Failed to publish news.");
    } finally {
      setPublishingId(null);
    }
  }

  async function handleRestore(id: number) {
    try {
      setRestoringId(id);
      await updateNews(id, { status: "draft" });
      await loadPageData(backendPagination.current_page);

      if (selectedNews?.id === id) {
        const refreshed = await getNewsById(id);
        setSelectedNews(refreshed.data);
      }
    } catch (error) {
      console.error("Failed to restore news:", error);
      alert("Failed to restore news.");
    } finally {
      setRestoringId(null);
    }
  }

  async function handleStartEdit(item: NewsItem) {
    try {
      const response = await getNewsById(item.id);
      const fullNews = response.data;

      setEditingId(fullNews.id);
      setEditForm({
        title: fullNews.title ?? "",
        content: fullNews.content ?? "",
        expires_at: formatDateTimeLocal(fullNews.expires_at),
      });
      setIsEditingNews(true);
    } catch (error) {
      console.error("Failed to load news for edit:", error);
      alert("Failed to load news for editing.");
    }
  }

  async function handleSaveEdit() {
    if (!editingId) return;

    if (!editForm.title.trim() || !editForm.content.trim()) {
      alert("Title and content are required.");
      return;
    }

    try {
      setSavingEdit(true);

      await updateNews(editingId, {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        expires_at: toApiDateTime(editForm.expires_at) ?? null,
      });

      setIsEditingNews(false);
      setEditingId(null);

      await loadPageData(backendPagination.current_page);

      if (selectedNews?.id === editingId) {
        const refreshed = await getNewsById(editingId);
        setSelectedNews(refreshed.data);
      }
    } catch (error) {
      console.error("Failed to update news:", error);
      alert("Failed to update news.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handlePreviousPage() {
    if (loading) return;

    if (filterStatus === "all") {
      if (!backendPagination.prev_page_url) return;
      await loadPageData(backendPagination.current_page - 1);
      return;
    }

    setLocalFilteredPage((prev) => Math.max(1, prev - 1));
  }

  async function handleNextPage() {
    if (loading) return;

    if (filterStatus === "all") {
      if (!backendPagination.next_page_url) return;
      await loadPageData(backendPagination.current_page + 1);
      return;
    }

    setLocalFilteredPage((prev) =>
      Math.min(localPaginationInfo.last_page, prev + 1)
    );
  }

  const listMeta =
    filterStatus === "all"
      ? {
          from: backendPagination.from,
          to: backendPagination.to,
          total: backendPagination.total,
          current_page: backendPagination.current_page,
          last_page: backendPagination.last_page,
          hasPrev: !!backendPagination.prev_page_url,
          hasNext: !!backendPagination.next_page_url,
        }
      : {
          from: localPaginationInfo.from,
          to: localPaginationInfo.to,
          total: localPaginationInfo.total,
          current_page: localPaginationInfo.current_page,
          last_page: localPaginationInfo.last_page,
          hasPrev: localPaginationInfo.hasPrev,
          hasNext: localPaginationInfo.hasNext,
        };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
            News & Offers
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Create and manage news and special offers for members
          </p>
        </div>

        <Dialog
          open={isAddingNews}
          onOpenChange={(open) => {
            setIsAddingNews(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white rounded-xl border-0 hover:shadow-md">
              <Plus size={16} className="mr-2" />
              Add News
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[560px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif]">
                Create News
              </DialogTitle>
              <DialogDescription>
                Publish news or save it as a draft
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-gray-600 text-sm">Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Eid Offer"
                  className="rounded-xl border-gray-200 bg-gray-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-600 text-sm">Full Content</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Write the full content here..."
                  rows={6}
                  className="rounded-xl border-gray-200 bg-gray-50 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-600 text-sm">Expiry Date</Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, expires_at: e.target.value }))
                  }
                  className="rounded-xl border-gray-200 bg-gray-50"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleCreate("public")}
                  disabled={submittingPublic || submittingDraft}
                  className="flex-1 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white rounded-xl border-0 hover:shadow-md"
                >
                  {submittingPublic ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Now"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleCreate("draft")}
                  disabled={submittingPublic || submittingDraft}
                  className="flex-1 rounded-xl border-gray-200 hover:border-[#0D7D6D] hover:text-[#0D7D6D]"
                >
                  {submittingDraft ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save as Draft"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboardStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div
                className={`${stat.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}
              >
                <Icon className={stat.color} size={20} />
              </div>
              <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-700 text-gray-900">
                {stat.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
              News List
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {listMeta.total > 0 &&
              listMeta.from !== null &&
              listMeta.to !== null
                ? `Showing ${listMeta.from}-${listMeta.to} of ${listMeta.total}`
                : "No news available"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  filterStatus === "all"
                    ? "bg-white text-[#0D7D6D] shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("public")}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  filterStatus === "public"
                    ? "bg-white text-[#0D7D6D] shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("draft")}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  filterStatus === "draft"
                    ? "bg-white text-[#0D7D6D] shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Drafts
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("expired")}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  filterStatus === "expired"
                    ? "bg-white text-amber-600 shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Expired
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("deleted")}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  filterStatus === "deleted"
                    ? "bg-white text-red-500 shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Trash
              </button>
            </div>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" size={18} />
            Loading...
          </div>
        ) : visibleNewsItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No news items found.
          </div>
        ) : (
          <>
            <div className="p-5 space-y-3">
              {visibleNewsItems.map((item) => {
                const expired = isNewsExpired(item);
                const displayStatus = getDisplayStatus(item);
                const remainingLabel = getRemainingLabel(item);

                return (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between p-4 rounded-2xl border transition-colors gap-4 ${
                      item.status === "deleted"
                        ? "bg-red-50 border-red-100"
                        : expired
                        ? "bg-amber-50 border-amber-100"
                        : "bg-gray-50 border-gray-100 hover:bg-gray-100/70"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenNews(item)}
                      className="flex items-start gap-4 flex-1 min-w-0 text-left"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 border border-gray-100">
                        {getNewsIcon(item.status)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900 text-sm">
                            {item.title}
                          </h4>

                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                              statusColors[displayStatus] ||
                              "bg-gray-100 text-gray-500 border-gray-200"
                            }`}
                          >
                            {displayStatus}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 mb-2 break-words">
                          {getExcerpt(item.content)}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar size={11} />
                            <span>{item.formatted_date || "-"}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <User size={11} />
                            <span>{item.author_name || "Unknown author"}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock3 size={11} />
                            <span>{remainingLabel}</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        title="View"
                        onClick={() => handleOpenNews(item)}
                        className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all"
                      >
                        <Eye size={14} />
                      </button>

                      {item.status !== "deleted" && (
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => handleStartEdit(item)}
                          className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-all"
                        >
                          <Pencil size={14} />
                        </button>
                      )}

                      {item.status === "draft" && (
                        <button
                          type="button"
                          title="Publish"
                          onClick={() => handlePublish(item.id)}
                          disabled={publishingId === item.id}
                          className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all disabled:opacity-60"
                        >
                          {publishingId === item.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                        </button>
                      )}

                      {item.status === "deleted" && (
                        <button
                          type="button"
                          title="Restore"
                          onClick={() => handleRestore(item.id)}
                          disabled={restoringId === item.id}
                          className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-all disabled:opacity-60"
                        >
                          {restoringId === item.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <RotateCcw size={14} />
                          )}
                        </button>
                      )}

                      {item.status !== "deleted" && (
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all disabled:opacity-60"
                        >
                          {deletingId === item.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Page {listMeta.current_page} of {listMeta.last_page}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={!listMeta.hasPrev || loading}
                  className="rounded-xl border-gray-200"
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={!listMeta.hasNext || loading}
                  className="rounded-xl border-gray-200"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog
        open={isViewOpen}
        onOpenChange={(open) => {
          setIsViewOpen(open);
          if (!open) {
            setSelectedNews(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[640px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif] text-xl text-gray-900">
              {selectedNews?.title || "News Details"}
            </DialogTitle>
            <DialogDescription>Full news details</DialogDescription>
          </DialogHeader>

          {viewLoading ? (
            <div className="py-10 flex items-center justify-center text-gray-500">
              <Loader2 className="animate-spin mr-2" size={18} />
              Loading news details...
            </div>
          ) : selectedNews ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                    statusColors[getDisplayStatus(selectedNews)] ||
                    "bg-gray-100 text-gray-500 border-gray-200"
                  }`}
                >
                  {getDisplayStatus(selectedNews)}
                </span>

                {selectedNews.status === "draft" && (
                  <Button
                    type="button"
                    onClick={() => handlePublish(selectedNews.id)}
                    disabled={publishingId === selectedNews.id}
                    className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {publishingId === selectedNews.id ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send size={14} className="mr-2" />
                        Publish
                      </>
                    )}
                  </Button>
                )}

                {selectedNews.status === "deleted" && (
                  <Button
                    type="button"
                    onClick={() => handleRestore(selectedNews.id)}
                    disabled={restoringId === selectedNews.id}
                    className="h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {restoringId === selectedNews.id ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <RotateCcw size={14} className="mr-2" />
                        Restore
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>{selectedNews.formatted_date || "-"}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <User size={14} />
                  <span>{selectedNews.author_name || "Unknown author"}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1">Published At</p>
                  <p className="text-sm text-gray-700">
                    {formatDisplayDateTime(selectedNews.published_at)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1">Expiry Date</p>
                  <p className="text-sm text-gray-700">
                    {formatDisplayDateTime(selectedNews.expires_at)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1">Remaining</p>
                  <p className="text-sm text-gray-700">
                    {getRemainingLabel(selectedNews)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1">Current Status</p>
                  <p className="text-sm text-gray-700 capitalize">
                    {getDisplayStatus(selectedNews)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm leading-7 text-gray-700 whitespace-pre-wrap">
                  {selectedNews.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">
              No news details found.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditingNews}
        onOpenChange={(open) => {
          setIsEditingNews(open);
          if (!open) {
            setEditingId(null);
            setEditForm({
              title: "",
              content: "",
              expires_at: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-['Plus_Jakarta_Sans',sans-serif]">
              Edit News
            </DialogTitle>
            <DialogDescription>
              Update news content and expiry date
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-600 text-sm">Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                className="rounded-xl border-gray-200 bg-gray-50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-600 text-sm">Full Content</Label>
              <Textarea
                value={editForm.content}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={6}
                className="rounded-xl border-gray-200 bg-gray-50 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-600 text-sm">Expiry Date</Label>
              <Input
                type="datetime-local"
                value={editForm.expires_at}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    expires_at: e.target.value,
                  }))
                }
                className="rounded-xl border-gray-200 bg-gray-50"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 bg-gradient-to-r from-[#0D7D6D] to-[#14B8A6] text-white rounded-xl border-0 hover:shadow-md"
              >
                {savingEdit ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsEditingNews(false)}
                className="flex-1 rounded-xl border-gray-200 hover:border-gray-400"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}