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
  SidebarInput,
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

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <NavLink end to={paths.loanCalculator}>
                <div className="flex aspect-square size-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Calculator className="size-8" />
                </div>
                <div className="grid min-w-0 flex-1 gap-0.5 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">حاسبة القروض</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">أدوات مالية</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarInput className="bg-background group-data-[collapsible=icon]:hidden" placeholder="بحث…" />
      </SidebarHeader>
      <SidebarSeparator className="mx-0 group-data-[collapsible=icon]:opacity-0" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2">التطبيق</SidebarGroupLabel>
          <SidebarGroupContent className="px-0">
            <SidebarMenu>
              {nav.map(({ to, end, label, icon: Icon }) => {
                const isActive = end
                  ? pathname === to
                  : pathname === to || pathname.startsWith(`${to}/`)
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                      <NavLink end={end} to={to}>
                        <Icon />
                        <span>{label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
              <span className="w-full truncate text-left">طيّ الشريط: Ctrl+B</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
