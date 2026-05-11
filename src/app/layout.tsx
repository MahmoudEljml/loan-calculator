import type { ReactNode } from "react"
import { AppSidebar } from "../components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar"
import { TooltipProvider } from "../components/ui/tooltip"

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <TooltipProvider>
                <AppSidebar />
                <main>
                    <SidebarTrigger />
                    {children}
                </main>
            </TooltipProvider>
        </SidebarProvider>
    )
}