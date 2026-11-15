import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../../lib/api';
import SafeContent from '../../components/SafeContent';
import {
  FileText,
  Save,
  Globe,
  ArrowLeft,
  Eye,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FolderTree,
} from 'lucide-react';

export default function ArticleEditorPage() {
  const { articleId } = useParams();
  const isEditing = Boolean(articleId);
  const navigate = useNavigate();
  const { currentMembership } = useAuth();
  const canPublish = currentMembership?.role === 'OWNER' || currentMembership?.role === 'ADMIN';

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('DRAFT');

  // UI state
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const catRes = await apiRequest('/api/v1/categories?status=ACTIVE');
        setCategories(catRes.categories || []);

        if (isEditing) {
          const artRes = await apiRequest(`/api/v1/articles/${articleId}`);
          const art = artRes.article;
          setTitle(art.title);
          setSlug(art.slug);
          setCategoryId(art.categoryId || '');
          setExcerpt(art.excerpt || '');
          setContent(art.content || '');
          setStatus(art.status);
        }
      } catch (err) {
        setError(err?.error?.message || 'Failed to load article');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [articleId, isEditing]);

  async function handleSave(targetStatus) {
    if (!title.trim()) {
      setError('Article title is required');
      return;
    }
    if (!content.trim()) {
      setError('Article content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        categoryId: categoryId || null,
        excerpt: excerpt.trim() || null,
        status: targetStatus,
      };

      if (slug.trim()) {
        payload.slug = slug.trim();
      }

      if (isEditing) {
        await apiRequest(`/api/v1/articles/${articleId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/v1/articles', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      navigate('/articles');
    } catch (err) {
      setError(err?.error?.message || 'Failed to save article');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span>Loading article editor...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/articles"
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to articles"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Edit Article' : 'Create Article'}
            </h1>
            <p className="text-xs text-gray-500">
              {isEditing ? `Editing /${slug}` : 'Draft a new knowledge base document'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-gray-500" />
            <span>Save Draft</span>
          </button>

          {canPublish && (
            <button
              type="button"
              onClick={() => handleSave('PUBLISHED')}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Globe className="w-4 h-4" />
              <span>{isEditing && status === 'PUBLISHED' ? 'Update & Publish' : 'Publish'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How to Configure Single Sign-On"
            className="w-full text-base font-bold border border-gray-300 rounded-lg px-3.5 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Slug and Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              URL Slug <span className="text-gray-400 font-normal">(auto-derived if blank)</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. how-to-configure-sso"
              className="w-full text-xs font-mono border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- No Category (Uncategorized) --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Short Excerpt <span className="text-gray-400 font-normal">(optional preview summary)</span>
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="A brief summary displayed on Help Center landing and search cards..."
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Content with Tab Toggle (Write vs Preview) */}
        <div>
          <div className="flex items-center justify-between border-b border-gray-200 mb-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('write')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'write'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Write (Markdown)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'preview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview (Safe XSS)</span>
              </button>
            </div>
            <span className="text-[11px] text-gray-400 hidden sm:inline">
              Supports markdown headers (#, ##), lists, bold, blockquotes, and code
            </span>
          </div>

          {activeTab === 'write' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              placeholder="# Article Heading&#10;&#10;Explain the steps clearly here...&#10;&#10;## Prerequisites&#10;- An active account&#10;- Admin access"
              className="w-full text-xs font-mono border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          ) : (
            <div className="min-h-[280px] p-4 bg-slate-50/70 border border-gray-200 rounded-lg overflow-y-auto">
              {content.trim() ? (
                <SafeContent content={content} />
              ) : (
                <span className="text-xs text-gray-400 italic">
                  Nothing to preview yet. Switch to Write tab to type content.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
