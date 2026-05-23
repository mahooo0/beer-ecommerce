'use client';

import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import './shepherd-custom.css';
import type { TourPage, TourStepDef } from './tours/tour-definitions';
import { TOUR_PAGES, getTourPageForPath } from './tours/tour-definitions';

const TOUR_STATE_KEY = 'ecom_site_tour';
const TOUR_COMPLETED_KEY = 'ecom_site_tour_completed';

interface TourState {
  active: boolean;
  currentPageIndex: number;
  currentStepIndex: number;
}

interface TourContextValue {
  startTour: () => void;
  stopTour: () => void;
  isTourActive: boolean;
  isTourCompleted: boolean;
  resetTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  startTour: () => {},
  stopTour: () => {},
  isTourActive: false,
  isTourCompleted: false,
  resetTour: () => {},
});

export function useSiteTour() {
  return useContext(TourContext);
}

function saveTourState(state: TourState) {
  try {
    sessionStorage.setItem(TOUR_STATE_KEY, JSON.stringify(state));
  } catch {}
}

function loadTourState(): TourState | null {
  try {
    const raw = sessionStorage.getItem(TOUR_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TourState;
  } catch {
    return null;
  }
}

function clearTourState() {
  try {
    sessionStorage.removeItem(TOUR_STATE_KEY);
  } catch {}
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const tourRef = useRef<Shepherd.Tour | null>(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [isTourCompleted, setIsTourCompleted] = useState(false);
  const isNavigatingRef = useRef(false);

  // Check if completed on mount
  useEffect(() => {
    setIsTourCompleted(localStorage.getItem(TOUR_COMPLETED_KEY) === 'true');
  }, []);

  // Resume tour on page navigation
  useEffect(() => {
    const state = loadTourState();
    if (!state?.active) return;

    const currentPage = TOUR_PAGES[state.currentPageIndex];
    if (!currentPage) return;

    // Check if we're on the right page
    const expectedPage = getTourPageForPath(pathname);
    if (!expectedPage || expectedPage.id !== currentPage.id) return;

    // Give DOM time to render elements
    const timer = setTimeout(() => {
      isNavigatingRef.current = false;
      buildAndStartTour(state.currentPageIndex, state.currentStepIndex);
    }, 600);

    return () => clearTimeout(timer);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildAndStartTour = useCallback(
    (pageIndex: number, stepIndex: number) => {
      // Cleanup previous tour
      if (tourRef.current) {
        tourRef.current.complete();
        tourRef.current = null;
      }

      const currentPage = TOUR_PAGES[pageIndex];
      if (!currentPage) return;

      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          classes: 'shepherd-theme-custom',
          scrollTo: { behavior: 'smooth', block: 'center' },
          cancelIcon: { enabled: true },
          modalOverlayOpeningPadding: 8,
          modalOverlayOpeningRadius: 4,
        },
      });

      // Build steps for this page
      const steps = currentPage.steps;
      const totalPagesSteps = TOUR_PAGES.reduce((sum, p) => sum + p.steps.length, 0);
      const stepsBeforePage = TOUR_PAGES.slice(0, pageIndex).reduce((sum, p) => sum + p.steps.length, 0);

      steps.forEach((stepDef, idx) => {
        const globalIndex = stepsBeforePage + idx;
        const isFirstStepOnFirstPage = pageIndex === 0 && idx === 0;
        const isLastStepOnLastPage = pageIndex === TOUR_PAGES.length - 1 && idx === steps.length - 1;
        const isLastStepOnPage = idx === steps.length - 1;
        const hasNextPage = pageIndex < TOUR_PAGES.length - 1;

        const buttons: Shepherd.Step.StepOptionsButton[] = [];

        // Back button
        if (!isFirstStepOnFirstPage) {
          buttons.push({
            text: 'Back',
            action: () => {
              if (idx === 0 && pageIndex > 0) {
                // Go back to previous page
                const prevPage = TOUR_PAGES[pageIndex - 1]!;
                const prevStepIndex = prevPage.steps.length - 1;
                saveTourState({
                  active: true,
                  currentPageIndex: pageIndex - 1,
                  currentStepIndex: prevStepIndex,
                });
                isNavigatingRef.current = true;
                tour.complete();
                router.push(prevPage.path);
              } else {
                tour.back();
                saveTourState({
                  active: true,
                  currentPageIndex: pageIndex,
                  currentStepIndex: idx - 1,
                });
              }
            },
            classes: 'shepherd-button-secondary',
          });
        }

        // Next / Navigate / Finish button
        if (isLastStepOnLastPage) {
          buttons.push({
            text: 'Finish Tour',
            action: () => {
              clearTourState();
              localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
              setIsTourCompleted(true);
              setIsTourActive(false);
              tour.complete();
            },
            classes: 'shepherd-button-primary',
          });
        } else if (isLastStepOnPage && hasNextPage) {
          const nextPage = TOUR_PAGES[pageIndex + 1]!;
          buttons.push({
            text: `Next: ${nextPage.title}`,
            action: () => {
              saveTourState({
                active: true,
                currentPageIndex: pageIndex + 1,
                currentStepIndex: 0,
              });
              isNavigatingRef.current = true;
              tour.complete();
              // Handle dynamic product detail route
              let targetPath = nextPage.path;
              if (targetPath.includes('__first__')) {
                const link = document.querySelector<HTMLAnchorElement>('a[href^="/products/"]');
                targetPath = link?.getAttribute('href') || '/products';
              }
              router.push(targetPath);
            },
            classes: 'shepherd-button-primary',
          });
        } else {
          buttons.push({
            text: 'Next',
            action: () => {
              tour.next();
              saveTourState({
                active: true,
                currentPageIndex: pageIndex,
                currentStepIndex: idx + 1,
              });
            },
            classes: 'shepherd-button-primary',
          });
        }

        const attachTo = stepDef.element
          ? { element: stepDef.element, on: (stepDef.position || 'bottom') as Shepherd.Step.PopperPlacement }
          : undefined;

        tour.addStep({
          id: `${currentPage.id}-step-${idx}`,
          title: stepDef.title,
          text: buildStepHTML(stepDef, globalIndex + 1, totalPagesSteps, currentPage),
          attachTo,
          buttons,
          beforeShowPromise: () => {
            return new Promise<void>((resolve) => {
              if (stepDef.element) {
                const el = document.querySelector(stepDef.element);
                if (el) {
                  resolve();
                } else {
                  // Wait for element to appear
                  setTimeout(resolve, 300);
                }
              } else {
                resolve();
              }
            });
          },
        });
      });

      // Handle tour cancel
      tour.on('cancel', () => {
        if (!isNavigatingRef.current) {
          clearTourState();
          setIsTourActive(false);
        }
      });

      tour.on('complete', () => {
        if (!isNavigatingRef.current) {
          // Tour was completed normally (not by navigation)
        }
      });

      tourRef.current = tour;
      setIsTourActive(true);

      // Start from specific step
      tour.start();
      if (stepIndex > 0) {
        for (let i = 0; i < stepIndex; i++) {
          tour.next();
        }
      }
    },
    [router],
  );

  const startTour = useCallback(() => {
    // Always start from the homepage
    const state: TourState = {
      active: true,
      currentPageIndex: 0,
      currentStepIndex: 0,
    };
    saveTourState(state);
    setIsTourActive(true);

    if (pathname === '/') {
      buildAndStartTour(0, 0);
    } else {
      isNavigatingRef.current = true;
      router.push('/');
    }
  }, [pathname, router, buildAndStartTour]);

  const stopTour = useCallback(() => {
    clearTourState();
    setIsTourActive(false);
    if (tourRef.current) {
      tourRef.current.cancel();
      tourRef.current = null;
    }
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setIsTourCompleted(false);
    clearTourState();
    setIsTourActive(false);
  }, []);

  return (
    <TourContext.Provider value={{ startTour, stopTour, isTourActive, isTourCompleted, resetTour }}>
      {children}
    </TourContext.Provider>
  );
}

function buildStepHTML(step: TourStepDef, current: number, total: number, page: TourPage): string {
  const progressPercent = Math.round((current / total) * 100);

  return `
    <div class="shepherd-custom-content">
      <div class="shepherd-page-badge">${page.title}</div>
      <p class="shepherd-step-description">${step.description}</p>
      ${step.tip ? `<div class="shepherd-tip"><strong>Tip:</strong> ${step.tip}</div>` : ''}
      <div class="shepherd-progress-bar">
        <div class="shepherd-progress-fill" style="width: ${progressPercent}%"></div>
      </div>
      <div class="shepherd-progress-text">${current} / ${total}</div>
    </div>
  `;
}
