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
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Send,
} from 'lucide-react';

export default function PublicArticleDetailPage() {
  const { tenantSlug, articleSlug } = useParams();
  const { tenant } = useOutletContext();

  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Feedback widget state
  const storageKey = `kh_feedback_${tenantSlug}_${articleSlug}`;
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null); // true | false | null
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  useEffect(() => {
    // Check if user already submitted feedback in this browser
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setHasSubmitted(true);
    }
  }, [storageKey]);

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

  async function handleFeedbackSubmit(e) {
    if (e) e.preventDefault();
    if (selectedRating === null) return;

    setIsSubmittingFeedback(true);
    setFeedbackError(null);

    try {
      await apiRequest(`/api/v1/public/${tenantSlug}/articles/${articleSlug}/feedback`, {
        method: 'POST',
        body: {
          helpful: selectedRating,
          comment: feedbackComment.trim() || undefined,
        },
      });

      setHasSubmitted(true);
      localStorage.setItem(storageKey, 'true');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setFeedbackError(err?.error?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

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

      {/* Helpful / Not Helpful Feedback Widget */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        {hasSubmitted ? (
          <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Thank you! Your feedback helps us improve our customer documentation.</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Was this article helpful?</h3>
                <p className="text-xs text-gray-500">Let us know how we can make our guides better.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRating(true)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedRating === true
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Yes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRating(false)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedRating === false
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>No</span>
                </button>
              </div>
            </div>

            {/* Optional Comment Section when a button is clicked */}
            {selectedRating !== null && (
              <form onSubmit={handleFeedbackSubmit} className="pt-3 border-t border-gray-100 space-y-3">
                <div>
                  <label htmlFor="feedbackComment" className="block text-xs font-medium text-gray-700 mb-1">
                    {selectedRating === true
                      ? "Glad it helped! Anything else you'd like to add? (Optional)"
                      : 'Sorry to hear that. How can we improve this article? (Optional)'}
                  </label>
                  <textarea
                    id="feedbackComment"
                    rows={3}
                    maxLength={1000}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Provide any details that could help us improve..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                    <span>{1000 - feedbackComment.length} characters remaining</span>
                  </div>
                </div>

                {feedbackError && (
                  <p className="text-xs text-red-600 font-medium">{feedbackError}</p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isSubmittingFeedback ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Submit Feedback</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRating(null);
                      setFeedbackComment('');
                      setFeedbackError(null);
                    }}
                    className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>

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
