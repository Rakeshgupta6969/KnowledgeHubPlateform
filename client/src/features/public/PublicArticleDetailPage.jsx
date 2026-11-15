import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import SafeContent from '../../components/SafeContent';
import {
  ChevronRight,
  ArrowLeft,
  Calendar,
  User,
  AlertCircle,
  Loader2,
  FolderTree,
} from 'lucide-react';

export default function PublicArticleDetailPage() {
  const { tenantSlug, articleSlug } = useParams();
  const { tenant } = useOutletContext();

  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadArticle() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiRequest(`/api/v1/public/${tenantSlug}/articles/${articleSlug}`);
        setArticle(res.article);
      } catch (err) {
        setError(err?.error?.message || 'Article not found');
      } finally {
        setIsLoading(false);
      }
    }

    if (tenantSlug && articleSlug) {
      loadArticle();
    }
  }, [tenantSlug, articleSlug]);

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-gray-500 mt-2">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4 max-w-md mx-auto shadow-sm">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-gray-900">Article Not Found</h2>
        <p className="text-xs text-gray-500">
          The requested article may have been archived or does not exist.
        </p>
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
    <article className="space-y-8 max-w-3xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 flex-wrap" aria-label="Breadcrumb">
        <Link to={`/help/${tenantSlug}`} className="hover:text-blue-600 transition-colors">
          Help Center
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        {article.category && (
          <>
            <Link
              to={`/help/${tenantSlug}/category/${article.category.slug}`}
              className="hover:text-blue-600 transition-colors"
            >
              {article.category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          </>
        )}
        <span className="font-semibold text-gray-900 truncate max-w-[200px]">{article.title}</span>
      </nav>

      {/* Article Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        {article.category && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            {article.category.name}
          </span>
        )}

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span>{article.author?.name || 'Support Team'}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>
              Updated {new Date(article.updatedAt || article.publishedAt).toLocaleDateString()}
            </span>
          </span>
        </div>

        {article.excerpt && (
          <div className="bg-slate-50 border-l-4 border-blue-500 p-4 rounded-r-xl text-xs text-gray-600 leading-relaxed italic">
            {article.excerpt}
          </div>
        )}
      </div>

      {/* Article Main Body with Safe XSS Sanitization */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
        <SafeContent content={article.content} />
      </div>

      {/* Navigation Footer */}
      <div className="pt-4 flex justify-between items-center text-xs text-gray-500">
        <Link
          to={`/help/${tenantSlug}`}
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Help Center</span>
        </Link>
      </div>
    </article>
  );
}
