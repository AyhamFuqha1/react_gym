import { useEffect, useMemo, useState } from "react";
import {
  Newspaper,
  FileText,
  Trash2,
  Plus,
  Eye,
  Calendar,
  BarChart2,
  Loader2,
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
  getNewsStats,
  type NewsItem,
} from "../../services/news";

const statusColors: Record<string, string> = {
  public: "bg-emerald-50 text-emerald-600 border-emerald-100",
  draft: "bg-gray-100 text-gray-500 border-gray-200",
  deleted: "bg-red-50 text-red-500 border-red-100",
};

function getExcerpt(content: string, maxLength = 90) {
  if (!content) return "";
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength)}...`;
}

function getStoredUserId() {
  const raw =
    localStorage.getItem("user_id") ||
    sessionStorage.getItem("user_id") ||
    "1";

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? 1 : parsed;
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

export function NewsManagement() {
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingPublic, setSubmittingPublic] = useState(false);
  const [submittingDraft, setSubmittingDraft] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [stats, setStats] = useState({
    published: 0,
    drafts: 0,
    total_views: 0,
  });

  const [form, setForm] = useState({
    title: "",
    content: "",
  });

  async function loadPageData() {
    setLoading(true);
    try {
      const [newsResponse, statsResponse] = await Promise.all([
        getNews(10),
        getNewsStats(),
      ]);

      setNewsItems(newsResponse.data?.data ?? []);
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
      setStats({
        published: 0,
        drafts: 0,
        total_views: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
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
        icon: BarChart2,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "Deleted",
        value: String(stats.total_views),
        icon: Trash2,
        color: "text-red-500",
        bg: "bg-red-50",
      },
    ],
    [stats]
  );

  function resetForm() {
    setForm({
      title: "",
      content: "",
    });
  }

  async function handleCreate(status: "public" | "draft") {
    if (!form.title.trim() || !form.content.trim()) {
      alert("Title and content are required.");
      return;
    }

    try {
      if (status === "public") {
        setSubmittingPublic(true);
      } else {
        setSubmittingDraft(true);
      }

      await createNews({
        user_id: getStoredUserId(),
        title: form.title.trim(),
        content: form.content.trim(),
        status,
      });

      resetForm();
      setIsAddingNews(false);
      await loadPageData();
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
      "Are you sure you want to delete this news item?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      await deleteNews(id);
      await loadPageData();
    } catch (error) {
      console.error("Failed to delete news:", error);
      alert("Failed to delete news.");
    } finally {
      setDeletingId(null);
    }
  }

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

        <Dialog open={isAddingNews} onOpenChange={setIsAddingNews}>
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
        <div className="px-6 py-5 border-b border-gray-50">
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-600 text-gray-900">
            All News
          </h3>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center text-gray-500">
            <Loader2 className="animate-spin mr-2" size={18} />
            Loading...
          </div>
        ) : newsItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No news items found.
          </div>
        ) : (
          <div className="p-5 space-y-3">
            {newsItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start justify-between p-4 rounded-2xl border transition-colors gap-4 ${
                  item.status === "deleted"
                    ? "bg-red-50 border-red-100 opacity-80"
                    : "bg-gray-50 border-gray-100 hover:bg-gray-100/70"
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
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
                          statusColors[item.status] ||
                          "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {item.status}
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
                        <Eye size={11} />
                        <span>{item.author_name || "Unknown author"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 flex-shrink-0">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}