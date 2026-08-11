import AppSidebar from '@/components/AppSidebar';
import Navbar from '@/components/Navbar';
import QueryProvider from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminChatWidget } from '@/components/ai-assistant/AdminChatWidget';
import { cookies } from 'next/headers';
import { ToastContainer } from 'react-toastify';
import { requireAdminAccess } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Gate the entire dashboard: non-admins are redirected to /unauthorized.
  await requireAdminAccess();

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <SidebarProvider defaultOpen={defaultOpen}>
          <div className="flex min-h-screen w-full bg-muted/40 ">
            <AppSidebar />
            <main className="flex-1 w-full bg-background rounded-xl border overflow-hidden">
              <Navbar />
              <div className="px-6 py-4">{children}</div>
            </main>
          </div>
        </SidebarProvider>
        <AdminChatWidget />
        <ToastContainer position="bottom-right" />
      </ThemeProvider>
    </QueryProvider>
  );
}
