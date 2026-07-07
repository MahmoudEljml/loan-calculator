import type { CSSProperties, UIEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar.tsx';
import { ModeToggle } from '@/components/mode-toggle.tsx';
import PWABadge from './PWA/PWABadge.tsx';
import InstallPWA from './PWA/InstallPWA.tsx';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ClientsPage } from './pages/ClientsPage.tsx';
import { AddClientPage } from './pages/AddClientPage.tsx';
import { ViewClientPage } from './pages/ViewClientPage.tsx';
import { IScoreCodesPage } from './pages/IscoreCodesPage.tsx';
import { LoanCalculatorPage } from './pages/LoanCalculatorPage.tsx';
import { InstallmentsPage } from './pages/InstallmentsPage.tsx';
import { EditInstallmentPage } from './pages/EditInstallmentPage.tsx';
import { paths } from './pages/paths.ts';
import './App.css';
import ShareDialog from '@/components/Dialog.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import { MapPage } from './pages/MapPage.tsx';

const STORAGE_KEY = 'loan-calculator-last-page';

type AppRoute = (typeof paths)[keyof typeof paths];
const validPaths = Object.values(paths) as AppRoute[];

function isAppRoute(value: string | null): value is AppRoute {
  return value !== null && validPaths.includes(value as AppRoute);
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isInitialized = useRef(false);

  const [scrollInstallments, setScrollInstallments] = useState(0);
  const [scrollIScoreCodes, setScrollIScoreCodes] = useState(0);
  const [scrollCustomers, setScrollCustomers] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Ref to hold the timeout ID for debouncing the scroll event
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize app: restore page and perform one-time cleanup
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;

      // 1. One-time localStorage cleanup
      const localStorageReset = "loan_cleanup_localstorage_v1";
      if (!localStorage.getItem(localStorageReset)) {
        localStorage.removeItem('loanShareOptions');
        localStorage.setItem(localStorageReset, 'true');
      }

      // 2. Restore the saved page
      const savedPage = window.localStorage.getItem(STORAGE_KEY);
      if (isAppRoute(savedPage) && savedPage !== location.pathname) {
        navigate(savedPage, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save current page and restore scroll position when route changes
  useEffect(() => {
    if (isAppRoute(location.pathname)) {
      window.localStorage.setItem(STORAGE_KEY, location.pathname);
    }

    if (location.pathname === paths.installments) {
      setTimeOutFunction(scrollInstallments);
    } else if (location.pathname === paths.iscoreCodes) {
      setTimeOutFunction(scrollIScoreCodes);
    } else if (location.pathname === paths.customers) {
      setTimeOutFunction(scrollCustomers);
    } else {
      scrollContainerRef?.current?.scrollTo(0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const setTimeOutFunction = (value: number) => {
    setTimeout(() => {
      scrollContainerRef?.current?.scrollTo(0, value);
    }, 700); // Consider reducing this delay if the transition feels slow
  };

  // Handle scroll events with Debounce to prevent performance issues
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;

    // Clear the previous timeout if user is still scrolling
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set a new timeout
    scrollTimeoutRef.current = setTimeout(() => {
      if (location.pathname === paths.installments) {
        setScrollInstallments(scrollTop);
      } else if (location.pathname === paths.iscoreCodes) {
        setScrollIScoreCodes(scrollTop);
      } else if (location.pathname === paths.customers) {
        setScrollCustomers(scrollTop);
      }
    }, 200);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width-mobile": "min(100vw - 1rem, 20rem)",
        } as CSSProperties
      }
    >
      <TooltipProvider>
        <AppSidebar />
        <SidebarInset className="bg-background pb-[env(safe-area-inset-bottom,0px)]">
          <header
            className={`
              flex shrink-0 gap-3 border-b border-border bg-background px-3 
              sm:flex-row sm:items-center sm:justify-between sm:px-4 
              transition-all duration-300 ease-in-out py-3
            `}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <SidebarTrigger className="size-10" />
            </div>
            <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2 ">
              <ShareDialog />
              <ModeToggle />
            </div>
          </header>

          <div
            ref={scrollContainerRef}
            id="scroll-container"
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
            onScroll={handleScroll} // Use React's built-in onScroll event
          >
            <div className="space-y-4 p-3 text-start sm:p-4">
              <Routes>
                <Route path={paths.loanCalculator} element={<LoanCalculatorPage />} />
                <Route path={paths.iscoreCodes} element={<IScoreCodesPage />} />
                <Route path={paths.customers} element={<ClientsPage />} />
                <Route path={paths.addClient} element={<AddClientPage />} />
                <Route path={paths.viewClient} element={<ViewClientPage />} />
                <Route path={paths.installments} element={<InstallmentsPage />} />
                <Route path={paths.editInstallment} element={<EditInstallmentPage />} />
                <Route path={paths.map} element={<MapPage />} />
                <Route path="*" element={<Navigate to={paths.loanCalculator} replace />} />
              </Routes>
              <InstallPWA />
              <PWABadge />
            </div>
          </div>
        </SidebarInset>
      </TooltipProvider>

      <Toaster
        position="top-center"
        richColors
        closeButton
        expand={false}
        duration={3000}
      />
    </SidebarProvider>
  );
}

export default App;