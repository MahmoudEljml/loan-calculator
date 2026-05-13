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
  // SidebarInput,
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

  // دالة لمسح كاش الـ PWA وإعادة تحميل الصفحة
  const clearPwaCacheAndReload = async () => {
    try {
      // 1. التحقق من وجود دعم لـ Service Worker
      if ('caches' in window) {
        // 2. الحصول على أسماء جميع الكاشات المخزنة
        const cacheNames = await caches.keys();

        // 3. حذف كل كاش موجود
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );

        console.log('تم مسح جميع ذواكر PWA المؤقتة بنجاح');
      }

      // 4. إيقاف الـ Service Worker الحالي لضمان إعادة تفعيله من جديد
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // إرسال إشارة للـ Service Worker لإيقافه (اختياري، يعتمد على إعداداتك)
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });

        // تسجيل الخروج من الـ Service Worker
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }

      // 5. إعادة تحميل الصفحة لتحميل الموقع والموارد من جديد
      window.location.reload();

    } catch (error) {
      console.error('حدث خطأ أثناء مسح الكاش:', error);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem >
            <SidebarMenuButton asChild size="lg" className="flex justify-center items-center">
              <NavLink end to={paths.loanCalculator} className="flex items-center justify-center w-full">
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Calculator className="size-6" />
                </div>
                <div className="grid min-w-0 flex-1 gap-0.5 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ">
                  <span className="truncate text-xs text-sidebar-foreground/70">أدوات مالية</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* <SidebarInput className="bg-background group-data-[collapsible=icon]:hidden" placeholder="بحث…" /> */}
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
                        <span dir="rtl">{label}</span>
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
