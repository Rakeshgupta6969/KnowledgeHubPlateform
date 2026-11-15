import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../../lib/api';
import {
  BarChart3,
  Eye,
  Search,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  FileText,
  PlusCircle,
  ShieldAlert,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { currentTenant, currentMembership } = useAuth();

  const [dateRangeKey, setDateRangeKey] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [topArticles, setTopArticles] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [noResultSearches, setNoResultSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate start/end ISO strings based on selected key
  function getDateParams(key) {
    const to = new Date().toISOString();
    let from;
    if (key === '7d') {
      from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (key === '30d') {
      from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (key === '90d') {
      from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      // all time
      from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    }
    return { from, to };
  }

  async function loadAnalytics() {
    setIsLoading(true);
    setError(null);
    try {
      const { from, to } = getDateParams(dateRangeKey);
      const queryStr = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

      const [overviewRes, articlesRes, searchesRes] = await Promise.all([
        apiRequest(`/api/v1/analytics/overview?${queryStr}`),
        apiRequest(`/api/v1/analytics/articles?${queryStr}&limit=10`),
        apiRequest(`/api/v1/analytics/searches?${queryStr}&limit=10`),
      ]);

      setOverview(overviewRes.metrics);
      setTopArticles(articlesRes.data || []);
      setPopularSearches(searchesRes.popularSearches || []);
      setNoResultSearches(searchesRes.noResultSearches || []);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(err?.error?.message || 'Failed to load analytics dashboard');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (currentMembership && currentMembership.role !== 'EDITOR') {
      loadAnalytics();
    }
  }, [dateRangeKey, currentMembership]);

  // RBAC Guard for UI
  if (currentMembership?.role === 'EDITOR') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Access Restricted</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          Analytics and customer insights are restricted to Workspace Owners and Admins. Please contact your company administrator to request access.
        </p>
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>View Articles</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>Help Center Analytics</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Documentation engagement, customer satisfaction, and search behavior for {currentTenant?.name}.
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center gap-1 shadow-2xs">
            {[
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
              { key: 'all', label: '1 Year' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDateRangeKey(tab.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  dateRangeKey === tab.key
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            className="p-2 border border-gray-200 bg-white rounded-xl text-gray-600 hover:text-blue-600 hover:bg-gray-50 shadow-2xs disabled:opacity-50 transition-colors"
            title="Refresh analytics data"
            aria-label="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-xs text-red-700 space-y-3">
          <p className="font-semibold">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : isLoading && !overview ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Aggregating analytics data...</p>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Views */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-500">Article Views</span>
                <div className="text-2xl font-black text-gray-900">
                  {overview?.totalViews?.toLocaleString() ?? 0}
                </div>
                <span className="text-[11px] text-gray-400">Excluding crawlers & bots</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
            </div>

            {/* Total Searches */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-500">Search Queries</span>
                <div className="text-2xl font-black text-gray-900">
                  {overview?.totalSearches?.toLocaleString() ?? 0}
                </div>
                <span className="text-[11px] text-gray-400">Total customer searches</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
            </div>

            {/* Helpfulness Ratio */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-500">Helpfulness Score</span>
                <div className="text-2xl font-black text-gray-900">
                  {overview?.helpfulRatio !== null ? `${overview.helpfulRatio}%` : 'N/A'}
                </div>
                <span className="text-[11px] text-gray-400">
                  {overview?.totalFeedback ?? 0} total ratings ({overview?.helpfulCount ?? 0} positive)
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ThumbsUp className="w-6 h-6" />
              </div>
            </div>

            {/* Unanswered Searches */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-gray-500">Unanswered Searches</span>
                <div className="text-2xl font-black text-gray-900">
                  {overview?.zeroResultSearches?.toLocaleString() ?? 0}
                </div>
                <span className="text-[11px] text-amber-600 font-medium">Missing content opportunities</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Feedback Sentiment Gauge */}
          {overview?.totalFeedback > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-900">Customer Satisfaction Breakdown</span>
                <span className="text-emerald-700">{overview.helpfulRatio}% Helpful</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${overview.helpfulRatio || 0}%` }}
                />
                <div
                  className="bg-red-400 h-full transition-all duration-500"
                  style={{ width: `${100 - (overview.helpfulRatio || 0)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span className="flex items-center gap-1 text-emerald-700">
                  <ThumbsUp className="w-3.5 h-3.5" /> {overview.helpfulCount} helpful
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <ThumbsDown className="w-3.5 h-3.5" /> {overview.unhelpfulCount} not helpful
                </span>
              </div>
            </div>
          )}

          {/* Top Performing Articles */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Top Articles</h3>
                <p className="text-xs text-gray-500">Most viewed guides and documentation</p>
              </div>
              <Link
                to="/articles"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                Manage Articles &rarr;
              </Link>
            </div>

            {topArticles.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No article activity recorded during this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-gray-500">
                      <th className="py-3 px-5 font-semibold">Article</th>
                      <th className="py-3 px-5 font-semibold">Status</th>
                      <th className="py-3 px-5 font-semibold text-right">Views</th>
                      <th className="py-3 px-5 font-semibold text-right">Feedback</th>
                      <th className="py-3 px-5 font-semibold text-right">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topArticles.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-gray-900 max-w-xs truncate">
                          <Link
                            to={`/articles/${art.id}/edit`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {art.title}
                          </Link>
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              art.status === 'PUBLISHED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {art.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-medium text-gray-900">
                          {art.viewsCount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5 text-right text-gray-600">
                          {art.feedbackCount} ({art.helpfulCount} / {art.unhelpfulCount})
                        </td>
                        <td className="py-3.5 px-5 text-right font-semibold">
                          {art.helpfulRatio !== null ? (
                            <span
                              className={
                                art.helpfulRatio >= 70
                                  ? 'text-emerald-600'
                                  : art.helpfulRatio >= 50
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }
                            >
                              {art.helpfulRatio}%
                            </span>
                          ) : (
                            <span className="text-gray-400 font-normal">No ratings</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Search Analytics: Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Searches */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Popular Search Queries</h3>
                <p className="text-xs text-gray-500">Most frequent terms customers search for</p>
              </div>

              {popularSearches.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No searches logged during this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 text-gray-500">
                        <th className="py-3 px-5 font-semibold">Query</th>
                        <th className="py-3 px-5 font-semibold text-right">Searches</th>
                        <th className="py-3 px-5 font-semibold text-right">Avg Results</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {popularSearches.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-3 px-5 font-medium text-gray-800">
                            "{s.query}"
                          </td>
                          <td className="py-3 px-5 text-right font-semibold text-gray-900">
                            {s.count}
                          </td>
                          <td className="py-3 px-5 text-right text-gray-500">
                            {s.avgResults}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Missing Content Opportunities (Zero Result Searches) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Searches with No Results</h3>
                <p className="text-xs text-amber-600 font-medium">Customer questions that found no articles</p>
              </div>

              {noResultSearches.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No zero-result searches! Your knowledge base is answering customer queries well.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 text-gray-500">
                        <th className="py-3 px-5 font-semibold">Unanswered Query</th>
                        <th className="py-3 px-5 font-semibold text-right">Times Asked</th>
                        <th className="py-3 px-5 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {noResultSearches.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-3 px-5 font-medium text-amber-900">
                            "{s.query}"
                          </td>
                          <td className="py-3 px-5 text-right font-semibold text-gray-900">
                            {s.count}
                          </td>
                          <td className="py-3 px-5 text-right">
                            <Link
                              to="/articles/new"
                              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Draft Article</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
