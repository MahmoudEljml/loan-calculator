import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppSidebar } from './components/app-sidebar.tsx';
import { ModeToggle } from './components/mode-toggle.tsx';
import PWABadge from './PWA/PWABadge.tsx';
import InstallPWA from './PWA/InstallPWA.tsx';
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { TooltipProvider } from './components/ui/tooltip';
import { CustomersPage } from './pages/CustomersPage.tsx';
import { IScoreCodesPage } from './pages/IscoreCodesPage.tsx';
import { LoanCalculatorPage } from './pages/LoanCalculatorPage.tsx';
import { paths } from './pages/paths.ts';
import './App.css';
import ShareDialog from './components/Dialog.tsx';

const STORAGE_KEY = 'loan-calculator-last-page'

type AppRoute = (typeof paths)[keyof typeof paths]
const validPaths = Object.values(paths) as AppRoute[]

function isAppRoute(value: string | null): value is AppRoute {
  return value !== null && validPaths.includes(value as AppRoute)
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const isInitialized = useRef(false)

  // استعادة الصفحة المحفوظة عند أول تحميل فقط

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true
      const savedPage = window.localStorage.getItem(STORAGE_KEY)
      if (isAppRoute(savedPage) && savedPage !== location.pathname) {
        navigate(savedPage, { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // حفظ الصفحة الحالية في localStorage عند كل تغيير
  useEffect(() => {
    if (isAppRoute(location.pathname)) {
      window.localStorage.setItem(STORAGE_KEY, location.pathname)
    }
  }, [location.pathname])

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
          <header className="flex shrink-0 gap-3 border-b border-border bg-background px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <SidebarTrigger />
            </div>
            <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
              <ShareDialog />
              <ModeToggle />
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <div className="space-y-4 p-3 text-start sm:p-4">
              <Routes>
                <Route path={paths.loanCalculator} element={<LoanCalculatorPage />} />
                <Route path={paths.iscoreCodes} element={<IScoreCodesPage />} />
                <Route path={paths.customers} element={<CustomersPage />} />
                <Route path="*" element={<Navigate to={paths.loanCalculator} replace />} />
              </Routes>
              <InstallPWA />
              <PWABadge />
            </div>
          </div>
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}

export default App;
