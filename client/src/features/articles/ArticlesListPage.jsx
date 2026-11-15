import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../../lib/api';
import SafeContent from '../../components/SafeContent';
import {
  FileText,
  Plus,
  Pencil,
  Eye,
  CheckCircle2,
  Archive,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
  User,
} from 'lucide-react';

export default function ArticlesListPage() {
  const { currentMembership, currentTenant } = useAuth();
  const navigate = useNavigate();
  const canPublishOrArchive =
    currentMembership?.role === 'OWNER' || currentMembership?.role === 'ADMIN';

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Preview Modal
  const [previewArticle, setPreviewArticle] = useState(null);

  async function fetchCategories() {
    try {
      const res = await apiRequest('/api/v1/categories?status=ALL');
      setCategories(res.categories || []);
    } catch (_err) {
      // Non-blocking
    }
  }

  async function fetchArticles() {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', 10);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await apiRequest(`/api/v1/articles?${params.toString()}`);
      setArticles(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err?.error?.message || 'Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [statusFilter, categoryFilter, page]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  }

  async function handlePublish(articleId) {
    try {
      await apiRequest(`/api/v1/articles/${articleId}/publish`, { method: 'POST' });
      fetchArticles();
    } catch (err) {
      alert(err?.error?.message || 'Failed to publish article');
    }
  }

  async function handleArchive(articleId) {
    if (!confirm('Are you sure you want to archive this article?')) return;
    try {
      await apiRequest(`/api/v1/articles/${articleId}`, { method: 'DELETE' });
      fetchArticles();
    } catch (err) {
      alert(err?.error?.message || 'Failed to archive article');
    }
  }

  const statusBadges = {
    PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
    ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            Articles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Author, edit, publish and organize customer support documentation.
          </p>
        </div>

        <Link
          to="/articles/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            {['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg w-44 sm:w-56 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 p-6 space-y-4">
          <div className="h-5 bg-slate-100 rounded w-1/4 animate-pulse"></div>
          <div className="h-14 bg-slate-50 rounded animate-pulse"></div>
          <div className="h-14 bg-slate-50 rounded animate-pulse"></div>
        </div>
      )}

      {/* Error Banner */}
      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm text-red-800 font-medium">{error}</p>
          <button
            onClick={fetchArticles}
            className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && articles.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">No articles found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {statusFilter !== 'ALL' || categoryFilter || searchTerm
                ? 'Try adjusting your filters or search terms.'
                : 'Start building your knowledge base by writing your first support article.'}
            </p>
          </div>
          <Link
            to="/articles/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Write First Article</span>
          </Link>
        </div>
      )}

      {/* Articles Table */}
      {!isLoading && !error && articles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {articles.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <p className="font-semibold text-gray-900 truncate">{art.title}</p>
                      <p className="text-[11px] font-mono text-gray-500 truncate">/{art.slug}</p>
                    </td>
                    <td className="py-3 px-4">
                      {art.category ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {art.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Uncategorized</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase ${
                          statusBadges[art.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {art.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <span className="truncate block max-w-[120px]">{art.author?.name || 'User'}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {new Date(art.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      {/* Preview Button */}
                      <button
                        onClick={() => setPreviewArticle(art)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Preview Article"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => navigate(`/articles/${art.id}/edit`)}
                        className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Edit Article"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Publish Button (Owner / Admin) */}
                      {canPublishOrArchive && art.status !== 'PUBLISHED' && (
                        <button
                          onClick={() => handlePublish(art.id)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Publish Article"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Archive Button (Owner / Admin) */}
                      {canPublishOrArchive && art.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchive(art.id)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          title="Archive Article"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {meta.totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-slate-50/50 text-xs text-gray-600">
              <span>
                Showing page <strong className="font-semibold text-gray-900">{meta.page}</strong> of{' '}
                <strong className="font-semibold text-gray-900">{meta.totalPages}</strong> ({meta.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="p-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewArticle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  Preview
                </span>
                <h3 className="text-sm font-bold text-gray-900 truncate">
                  {previewArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h1 className="text-xl font-extrabold text-gray-900">{previewArticle.title}</h1>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                  {previewArticle.category && (
                    <span className="font-medium text-blue-600">
                      {previewArticle.category.name}
                    </span>
                  )}
                  <span>•</span>
                  <span>Status: {previewArticle.status}</span>
                </div>
                {previewArticle.excerpt && (
                  <p className="text-xs text-gray-600 italic mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {previewArticle.excerpt}
                  </p>
                )}
              </div>

              {/* Safe XSS-Sanitized Content Rendering */}
              <SafeContent content={previewArticle.content} />
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
