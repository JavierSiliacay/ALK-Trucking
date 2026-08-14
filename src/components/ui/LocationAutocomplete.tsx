"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, MapPin } from "lucide-react";

interface LocationAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function LocationAutocomplete({ value, onChange, placeholder, className, required }: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isTyping = useRef(false);

  // Sync external value changes
  useEffect(() => {
    if (value !== query) {
      isTyping.current = false;
      setQuery(value);
    }
  }, [value]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced fetch
  useEffect(() => {
    const fetchResults = async () => {
      if (!isTyping.current || !query || query.length < 2) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const res = await fetch(`/api/geocode/autocomplete?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          if (isTyping.current) {
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceId = setTimeout(() => {
      fetchResults();
    }, 400);

    return () => clearTimeout(debounceId);
  }, [query]);

  const handleSelect = (item: any) => {
    isTyping.current = false; // Prevent fetching again!
    const finalName = item.name.toUpperCase();
    setQuery(finalName);
    onChange(finalName);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isTyping.current = true; // User is actively typing
    const val = e.target.value.toUpperCase();
    setQuery(val);
    onChange(val);
    
    if (val.length > 1) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (query.length > 1 && results.length > 0) setIsOpen(true); }}
        placeholder={placeholder}
        className={className || "w-full h-9 px-2 bg-white border border-gray-300 rounded text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-center"}
        required={required}
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-[100] w-full min-w-[200px] left-0 mt-1 bg-white border border-gray-200 rounded shadow-xl max-h-60 overflow-y-auto text-left">
          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-0 flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-800 leading-tight">{item.name}</p>
                <p className="text-xs text-gray-500 truncate leading-tight mt-0.5">
                  {[item.locality, item.county, item.region].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
