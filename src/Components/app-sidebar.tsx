import { Calculator, Hash, Users } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "./ui/sidebar"
import { paths } from "@/pages/paths"


const nav = [
  {
    to: paths.loanCalculator,
    end: true,
    label: "حاسبة القروض",
    icon: Calculator,
  },
  {
    to: paths.iscoreCodes,
    end: false,
    label: "أكواد iScore",
    icon: Hash,
  },
  {
    to: paths.customers,
    end: false,
    label: "بيانات العملاء",
    icon: Users,
  },
] as const

export function AppSidebar() {
  const { pathname } = useLocation()

  const clearPwaCacheAndReload = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
      }
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(r => r.unregister()))
      }
      window.location.reload()
    } catch (error) {
      console.error('حدث خطأ أثناء مسح الكاش:', error)
    }
  }

  return (
    <Sidebar collapsible="icon" variant="inset" className="text-lg">

      {/* ─── Header ─── */}
      <SidebarHeader >
        <SidebarMenu className="items-center" >
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
            // className="group-data-[collapsible=icon]:justify-center"
            >
              <NavLink
                end
                to={paths.loanCalculator}
                className="flex w-full items-center gap-2 "
              >
                {/* الأيقونة - دايماً ظاهرة في كلا الـ modes */}
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Calculator className="size-4" />
                </div>

                {/* النص - مخفي في icon mode */}
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ">
                  <span className="truncate font-semibold text-lg">أدوات مالية</span>
                  <span className="truncate text-xs text-muted-foreground">Finance Tools</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className="mx-0 group-data-[collapsible=icon]:opacity-0" />

      {/* ─── Content ─── */}
      <SidebarContent dir="rtl" >
        <SidebarGroup className="gap-2" >
          <SidebarGroupLabel className="px-2 text-lg" >التطبيق</SidebarGroupLabel>
          <SidebarGroupContent className="px-0" >
            <SidebarMenu  >
              {nav.map(({ to, end, label, icon: Icon }) => {
                const isActive = end
                  ? pathname === to
                  : pathname === to || pathname.startsWith(`${to}/`)
                return (
                  <SidebarMenuItem key={to}  >
                    <SidebarMenuButton asChild isActive={isActive} className="my-2">
                      <NavLink end={end} to={to}>
                        <Icon />
                        <span dir="rtl" className=" text-lg ">{label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ─── Footer ─── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={clearPwaCacheAndReload}>
              <span>clear cache</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}