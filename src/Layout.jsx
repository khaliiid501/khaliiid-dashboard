import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  LayoutDashboard, 
  Sparkles, 
  Library, 
  Calendar,
  Megaphone,
  FileText,
  Brain,
  TrendingUp, 
  BarChart3, 
  Settings, 
  Crown,
  Menu,
  X,
  Zap
} from 'lucide-react';
import { cn } from "@/lib/utils";
import NotificationBell from './components/NotificationBell';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { name: 'لوحة التحكم', page: 'Home', icon: LayoutDashboard },
    { name: 'إنشاء محتوى', page: 'CreateContent', icon: Sparkles },
    { name: 'مكتبة المحتوى', page: 'ContentLibrary', icon: Library },
    { name: 'جدولة النشر', page: 'Schedule', icon: Calendar },
    { name: 'الحملات', page: 'Campaigns', icon: Megaphone },
    { name: 'الأتمتة', page: 'Automation', icon: Zap },
    { name: 'القوالب', page: 'Templates', icon: FileText },
    { name: 'تدريب AI', page: 'AITraining', icon: Brain },
    { name: 'الترندات', page: 'Trends', icon: TrendingUp },
    { name: 'التحليلات', page: 'Analytics', icon: BarChart3 },
    { name: 'الباقات', page: 'Pricing', icon: Crown },
    { name: 'الإعدادات', page: 'Settings', icon: Settings },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 data-mesh-bg">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 h-full w-72 bg-white/80 backdrop-blur-xl border-l border-slate-200/50 shadow-2xl z-50 transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full relative">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200/50 relative">
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-6 left-6 p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg animate-pulse-glow">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  المحتوى الذكي
                </h1>
                <p className="text-xs text-slate-500 font-medium">AI Marketing Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-l from-blue-500 to-emerald-500 text-white shadow-lg"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-white/20 animate-shimmer" />
                  )}
                  <Icon className={cn(
                    "w-5 h-5 transition-transform",
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )} />
                  <span className="font-semibold">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-slate-200/50 space-y-3">
            <div className="flex items-center justify-center">
              <NotificationBell />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                م
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">مستخدم تجريبي</p>
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-500" />
                  الباقة المتقدمة
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:mr-72">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold gradient-text">
                المحتوى الذكي
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 relative z-10">
          <div className="slide-in-animation">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}