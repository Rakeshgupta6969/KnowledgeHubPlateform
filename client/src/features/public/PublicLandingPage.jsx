import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import {
  Search,
  FolderTree,
  ChevronRight,
  Loader2,
  X,
  Filter,
} from 'lucide-react';

export default function PublicLandingPage() {
  const { tenantSlug } = useParams();
  const { tenant } = useOutletContext();

  const [categories, setCategories] = useState([]);
  const [popularArticles, setPopularArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Load initial public landing data
  useEffect(() => {
    async function loadPublicData() {
      setIsLoading(true);
      try {
        const [catRes, artRes] = await Promise.all([
          apiRequest(`/api/v1/public/${tenantSlug}/categories`),
          apiRequest(`/api/v1/public/${tenantSlug}/articles?limit=8`),
        ]);
        setCategories(catRes.categories || []);
        setPopularArticles(artRes.data || []);
      } catch (err) {
        console.error('Failed to load public portal data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (tenantSlug) {
      loadPublicData();
    }
  }, [tenantSlug]);

  // Execute full-text search with debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const queryParams = new URLSearchParams({
          q: trimmed,
          limit: '20',
        });
        if (selectedCategory) {
          queryParams.append('category', selectedCategory);
        }

        const res = await apiRequest(
          `/api/v1/public/${tenantSlug}/search?${queryParams.toString()}`
        );
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('Search error:', err);
        setSearchError(err?.error?.message || 'Failed to complete search');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, tenantSlug]);

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-gray-500 mt-2">Loading documentation...</p>
      </div>
    );
  }

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-8 sm:py-12 bg-gradient-to-b from-blue-50/50 to-transparent rounded-3xl p-6 sm:p-10 border border-blue-50/60">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          How can we help you today?
        </h1>
        <p className="text-sm text-gray-600 mt-2 max-w-xl mx-auto">
          Search our knowledge base for answers, setup guides, and troubleshooting instructions.
        </p>

        {/* Search Input Box */}
        <div className="mt-6 max-w-xl mx-auto relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles, guides, and questions..."
            className="w-full text-sm pl-12 pr-10 py-3 rounded-2xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter by:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Topics
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)
                }
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Dynamic Results / Popular Articles Section */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isSearchActive
                ? `Search Results ${!isSearching ? `(${searchResults.length})` : ''}`
                : 'Popular Articles'}
            </h2>
            <p className="text-xs text-gray-500">
              {isSearchActive
                ? selectedCategory
                  ? `Filtered by "${categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}"`
                  : 'Matching articles across all categories'
                : 'Verified customer guides and documentation'}
            </p>
          </div>
        </div>

        {isSearching ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-gray-500 mt-2">Searching knowledge base...</p>
          </div>
        ) : searchError ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center text-red-600 text-xs">
            {searchError}
          </div>
        ) : isSearchActive ? (
          searchResults.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-gray-800">
                No articles matched "{searchQuery}"
              </p>
              <p className="text-xs text-gray-500">
                Try using different keywords or removing the category filter.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-xs overflow-hidden">
              {searchResults.map((art) => (
                <Link
                  key={art.id}
                  to={`/help/${tenantSlug}/article/${art.slug}`}
                  className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors group block"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {art.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                          {art.category.name}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">
                        {art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
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
          )
        ) : popularArticles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-xs">
            No published articles available yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-xs overflow-hidden">
            {popularArticles.map((art) => (
              <Link
                key={art.id}
                to={`/help/${tenantSlug}/article/${art.slug}`}
                className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors group block"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {art.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                        {art.category.name}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">
                      {art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
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
      </section>

      {/* Categories Grid (shown when not actively searching) */}
      {!isSearchActive && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Browse by Topic</h2>
              <p className="text-xs text-gray-500">Explore support categories</p>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-xs">
              No public categories available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/help/${tenantSlug}/category/${cat.slug}`}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {cat.description || 'Guides and tutorials in this category.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">
                      {cat._count?.articles ?? 0} {cat._count?.articles === 1 ? 'article' : 'articles'}
                    </span>
                    <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Browse <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
