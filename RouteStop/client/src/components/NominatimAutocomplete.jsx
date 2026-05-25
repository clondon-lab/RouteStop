import { useState, useRef, useEffect, useCallback } from 'react';

export default function NominatimAutocomplete({ value, onChange, placeholder, onSelect, label }) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Sync if parent clears the value
  useEffect(() => {
    if (!value) setQuery('');
  }, [value]);

  const fetchSuggestions = useCallback(async (q) => {
    if (q.trim().length < 3) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange?.(null); // clear selection while typing
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 300);
  };

  const handleSelect = (result) => {
    setQuery(result.name);
    setOpen(false);
    setResults([]);
    onSelect(result);
  };

  const handleBlur = () => {
    // Small delay so click on suggestion registers first
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      )}
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {results.map((r, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(r)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700 border-b border-gray-100 last:border-0"
            >
              <div className="font-medium truncate">{r.name.split(',')[0]}</div>
              <div className="text-xs text-gray-400 truncate">{r.name.split(',').slice(1, 3).join(',')}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
