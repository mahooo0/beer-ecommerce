'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { CategoryWithChildren } from './mega-menu';

interface CategoryNavProps {
  categories: CategoryWithChildren[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeL0, setActiveL0] = useState<string | null>(null);
  const [activeL1, setActiveL1] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveL0(null);
      setActiveL1(null);
    }, 150);
  }, [cancelClose]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveL0(null);
        setActiveL1(null);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setActiveL0(null);
        setActiveL1(null);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    return () => cancelClose();
  }, [cancelClose]);

  const handleNavigate = () => {
    setIsOpen(false);
    setActiveL0(null);
    setActiveL1(null);
  };

  const activeL0Category = activeL0 ? categories.find((c) => c.id === activeL0) : null;
  const activeL1Category = activeL0Category?.children.find((c) => c.id === activeL1);

  // Determine how many columns are visible for dynamic width
  const hasL1Panel = activeL0Category && activeL0Category.children.length > 0;
  const hasL2Panel = activeL1Category && activeL1Category.children.length > 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) {
            setActiveL0(null);
            setActiveL1(null);
          }
        }}
        onMouseEnter={() => {
          cancelClose();
          setIsOpen(true);
        }}
        onMouseLeave={scheduleClose}
        className="inline-flex items-center gap-1.5 py-2 text-xs font-medium tracking-[0.15em] text-neutral-600 uppercase transition-colors hover:text-neutral-900"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        Categories
        <svg
          className={`size-3 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Flyout panel */}
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 flex rounded-lg border border-neutral-200 bg-white shadow-xl"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          role="menu"
        >
          {/* L0 — Top-level categories */}
          <div className="w-56 shrink-0 border-r border-neutral-100 py-2">
            <div className="px-3 pb-2">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
                All Categories
              </span>
            </div>
            {categories.map((cat) => {
              const isActive = activeL0 === cat.id;
              const hasChildren = cat.children.length > 0;
              return (
                <div
                  key={cat.id}
                  onMouseEnter={() => {
                    setActiveL0(cat.id);
                    setActiveL1(null);
                  }}
                  role="menuitem"
                >
                  <Link
                    href={`/categories/${cat.slug}`}
                    onClick={handleNavigate}
                    className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-neutral-50 text-neutral-900 font-medium'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {hasChildren && (
                      <svg
                        className={`size-3.5 shrink-0 transition-colors ${isActive ? 'text-neutral-500' : 'text-neutral-300'}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* L1 — Subcategories */}
          {hasL1Panel && (
            <div className="w-56 shrink-0 border-r border-neutral-100 py-2">
              <div className="px-3 pb-2">
                <Link
                  href={`/categories/${activeL0Category.slug}`}
                  onClick={handleNavigate}
                  className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase hover:text-neutral-600 transition-colors"
                >
                  All {activeL0Category.name}
                </Link>
              </div>
              {activeL0Category.children.map((sub) => {
                const isActive = activeL1 === sub.id;
                const hasChildren = sub.children.length > 0;
                return (
                  <div
                    key={sub.id}
                    onMouseEnter={() => setActiveL1(sub.id)}
                    role="menuitem"
                  >
                    <Link
                      href={`/categories/${sub.slug}`}
                      onClick={handleNavigate}
                      className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-neutral-50 text-neutral-900 font-medium'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                    >
                      <span className="truncate">{sub.name}</span>
                      {hasChildren && (
                        <svg
                          className={`size-3.5 shrink-0 transition-colors ${isActive ? 'text-neutral-500' : 'text-neutral-300'}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* L2 — Sub-subcategories */}
          {hasL2Panel && activeL1Category && (
            <div className="w-56 shrink-0 py-2">
              <div className="px-3 pb-2">
                <Link
                  href={`/categories/${activeL1Category.slug}`}
                  onClick={handleNavigate}
                  className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase hover:text-neutral-600 transition-colors"
                >
                  All {activeL1Category.name}
                </Link>
              </div>
              {activeL1Category.children.map((sub2) => (
                <div key={sub2.id} role="menuitem">
                  <Link
                    href={`/categories/${sub2.slug}`}
                    onClick={handleNavigate}
                    className="flex items-center px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                  >
                    <span className="truncate">{sub2.name}</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
