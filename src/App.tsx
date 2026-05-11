import type { CSSProperties } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
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

function App() {
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
          <header className="flex shrink-0 flex-col gap-3 border-b border-border bg-background px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <SidebarTrigger className="shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">التطبيق</p>
                <p className="truncate text-sm font-semibold sm:text-base">
                  حاسبة القروض والأدوات
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
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
