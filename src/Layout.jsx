import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  LayoutDashboard, 
  Sparkles, 
  Library, 
  Megaphone,
  FileText,
  Brain,
  TrendingUp, 
  BarChart3, 
  Settings, 
  Crown,
  Menu,
  X
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { name: 'لوحة التحكم', page: 'Home', icon: LayoutDashboard },
    { name: 'إنشاء محتوى', page: 'CreateContent', icon: Sparkles },
    { name: 'مكتبة المحتوى', page: 'ContentLibrary', icon: Library },
    { name: 'الحملات', page: 'Campaigns', icon: Megaphone },
    { name: 'القوالب', page: 'Templates', icon: FileText },
    { name: 'تدريب AI', page: 'AITraining', icon: Brain },
    { name: 'الترندات', page: 'Trends', icon: TrendingUp },
    { name: 'التحليلات', page: 'Analytics', icon: BarChart3 },
    { name: 'الباقات', page: 'Pricing', icon: Crown },
    { name: 'الإعدادات', page: 'Settings', icon: Settings },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 h-full w-64 bg-white border-l border-slate-200 shadow-lg z-50 transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200">
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-6 left-6"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-l from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              المحتوى الذكي
            </h1>
            <p className="text-xs text-slate-600 mt-1">منصة التسويق بالذكاء الاصطناعي</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive
                      ? "bg-gradient-to-l from-emerald-500 to-blue-600 text-white shadow-md"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold">
                م
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">مستخدم تجريبي</p>
                <p className="text-xs text-slate-600">الباقة المتقدمة</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:mr-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold bg-gradient-to-l from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              المحتوى الذكي
            </h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}