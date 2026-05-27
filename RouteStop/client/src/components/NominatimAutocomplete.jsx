import { useState, useRef, useEffect, useCallback } from 'react';

export default function NominatimAutocomplete({ value, onChange, placeholder, onSelect, label }) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

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
    onChange?.(null);
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
    setTimeout(() => setOpen(false), 150);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      )}
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto">
          {results.map((r, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(r)}
              className="px-3 py-2.5 text-sm cursor-pointer hover:bg-white/5 text-slate-200 border-b border-white/5 last:border-0 transition-colors"
            >
              <div className="font-medium truncate text-white">{r.name.split(',')[0]}</div>
              <div className="text-xs text-slate-500 truncate">{r.name.split(',').slice(1, 3).join(',')}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
