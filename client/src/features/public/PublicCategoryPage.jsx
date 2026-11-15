import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import {
  ChevronRight,
  FolderTree,
  FileText,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function PublicCategoryPage() {
  const { tenantSlug, categorySlug } = useParams();
  const { tenant } = useOutletContext();

  const [category, setCategory] = useState(null);
  const [articles, setArticles] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCategoryArticles() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiRequest(
          `/api/v1/public/${tenantSlug}/articles?categorySlug=${categorySlug}`
        );
        setCategory(res.category);
        setArticles(res.data || []);
        setMeta(res.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
      } catch (err) {
        setError(err?.error?.message || 'Category not found');
      } finally {
        setIsLoading(false);
      }
    }

    if (tenantSlug && categorySlug) {
      loadCategoryArticles();
    }
  }, [tenantSlug, categorySlug]);

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-gray-500 mt-2">Loading category articles...</p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4 max-w-md mx-auto shadow-sm">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-gray-900">Category Not Found</h2>
        <p className="text-xs text-gray-500">{error || 'The requested category does not exist.'}</p>
        <Link
          to={`/help/${tenantSlug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Help Center</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500" aria-label="Breadcrumb">
        <Link to={`/help/${tenantSlug}`} className="hover:text-blue-600 transition-colors">
          Help Center
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-semibold text-gray-900">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FolderTree className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
        </div>
        {category.description && (
          <p className="text-xs text-gray-600 mt-1 max-w-2xl">{category.description}</p>
        )}
      </div>

      {/* Published Articles List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-gray-500">
          Articles in this category ({meta.total})
        </h2>

        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-xs">
            No published articles in this category yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-xs overflow-hidden">
            {articles.map((art) => (
              <Link
                key={art.id}
                to={`/help/${tenantSlug}/article/${art.slug}`}
                className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors group block"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="text-[11px] text-gray-400">
                    {art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : ''}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {art.title}
                  </h3>
                  {art.excerpt && (
                    <p className="text-xs text-gray-500 line-clamp-2">{art.excerpt}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all self-center flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
