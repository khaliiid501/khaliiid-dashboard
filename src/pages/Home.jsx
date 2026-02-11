import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/ui/stat-card";
import GradientButton from "@/components/ui/gradient-button";
import { 
  Sparkles, 
  TrendingUp, 
  Calendar,
  Eye,
  Heart,
  MousePointerClick,
  Megaphone,
  Zap,
  BarChart3,
  ArrowLeft,
  Play,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export default function Home() {
  const { data: campaigns = [] } = useQuery({
    queryKey: ['homeCampaigns'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Campaign.filter({ created_by: user.email }, '-created_date', 5);
    },
  });

  const { data: content = [] } = useQuery({
    queryKey: ['homeContent'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Content.filter({ created_by: user.email }, '-created_date', 10);
    },
  });

  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['homeScheduled'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.ScheduledPost.filter({ created_by: user.email }, '-scheduled_date', 5);
    },
  });

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const publishedContent = content.filter(c => c.status === 'published');
  const pendingPosts = scheduledPosts.filter(p => p.status === 'pending');
  
  const totalViews = publishedContent.reduce((sum, c) => sum + (c.performance_views || 0), 0);
  const totalEngagement = publishedContent.reduce((sum, c) => sum + (c.performance_engagement || 0), 0);
  const totalConversions = publishedContent.reduce((sum, c) => sum + (c.performance_conversions || 0), 0);

  const recentPerformance = publishedContent.slice(0, 7).reverse().map(c => ({
    name: c.title.substring(0, 10),
    مشاهدات: c.performance_views || 0,
    تفاعل: c.performance_engagement || 0
  }));

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 p-8 lg:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/90 text-sm font-medium">النظام يعمل بكفاءة</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              مرحباً بك في
              <br />
              <span className="bg-gradient-to-l from-blue-300 to-emerald-300 bg-clip-text text-transparent">
                عصر التسويق الذكي
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              أنشئ حملات إعلانية احترافية بالذكاء الاصطناعي
              <br />
              من الفكرة إلى النتيجة في دقائق
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Link to={createPageUrl('CreateContent')}>
                <GradientButton size="lg" icon={Sparkles}>
                  ابدأ الإنشاء الآن
                </GradientButton>
              </Link>
              <Link to={createPageUrl('Analytics')}>
                <button className="h-14 px-8 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all backdrop-blur-sm">
                  عرض التحليلات
                </button>
              </Link>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Eye className="w-5 h-5 text-blue-300" />
                </div>
                <span className="text-sm text-white/70">المشاهدات</span>
              </div>
              <p className="text-3xl font-bold text-white font-mono">{totalViews.toLocaleString()}</p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Heart className="w-5 h-5 text-emerald-300" />
                </div>
                <span className="text-sm text-white/70">التفاعل</span>
              </div>
              <p className="text-3xl font-bold text-white font-mono">{totalEngagement}</p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Target className="w-5 h-5 text-amber-300" />
                </div>
                <span className="text-sm text-white/70">التحويلات</span>
              </div>
              <p className="text-3xl font-bold text-white font-mono">{totalConversions}</p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Megaphone className="w-5 h-5 text-purple-300" />
                </div>
                <span className="text-sm text-white/70">حملات نشطة</span>
              </div>
              <p className="text-3xl font-bold text-white font-mono">{activeCampaigns.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">مؤشرات الأداء الرئيسية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي المحتوى"
            value={content.length}
            icon={Sparkles}
            accentColor="blue"
            trend="up"
            trendValue="+12% هذا الأسبوع"
          />
          <StatCard
            title="منشورات مجدولة"
            value={pendingPosts.length}
            icon={Calendar}
            accentColor="emerald"
          />
          <StatCard
            title="الحملات النشطة"
            value={activeCampaigns.length}
            icon={Megaphone}
            accentColor="purple"
          />
          <StatCard
            title="معدل النجاح"
            value="87%"
            icon={TrendingUp}
            accentColor="amber"
            trend="up"
            trendValue="+5%"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2 glass-card hover-lift border-slate-200/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                أداء المحتوى الأخير
              </CardTitle>
              <Link to={createPageUrl('Analytics')}>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  عرض الكل
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={recentPerformance}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Line type="monotone" dataKey="مشاهدات" stroke="#0EA5E9" strokeWidth={3} dot={{ fill: '#0EA5E9', r: 4 }} />
                  <Line type="monotone" dataKey="تفاعل" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>ابدأ بإنشاء محتوى لرؤية الأداء</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-card hover-lift border-slate-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              إجراءات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to={createPageUrl('CreateContent')}>
              <button className="w-full p-4 rounded-xl bg-gradient-to-l from-blue-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-between group">
                <span>إنشاء محتوى جديد</span>
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
            </Link>

            <Link to={createPageUrl('Campaigns')}>
              <button className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-between group">
                <span className="font-semibold text-slate-700">إطلاق حملة</span>
                <Megaphone className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
              </button>
            </Link>

            <Link to={createPageUrl('Schedule')}>
              <button className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all flex items-center justify-between group">
                <span className="font-semibold text-slate-700">جدولة نشر</span>
                <Calendar className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
              </button>
            </Link>

            <Link to={createPageUrl('Trends')}>
              <button className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all flex items-center justify-between group">
                <span className="font-semibold text-slate-700">استكشاف الترندات</span>
                <TrendingUp className="w-5 h-5 text-slate-600 group-hover:text-purple-600 transition-colors" />
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns & Scheduled Posts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Campaigns */}
        <Card className="glass-card border-slate-200/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                الحملات النشطة
              </CardTitle>
              <Link to={createPageUrl('Campaigns')}>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  عرض الكل
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeCampaigns.length > 0 ? (
              <div className="space-y-3">
                {activeCampaigns.map((campaign) => (
                  <div 
                    key={campaign.id} 
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {campaign.campaign_name}
                      </h4>
                      <div className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        نشطة
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {(campaign.total_reach || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {campaign.total_engagement || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        ROI {campaign.roi || 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-600 mb-4">لا توجد حملات نشطة</p>
                <Link to={createPageUrl('Campaigns')}>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    إنشاء حملة جديدة
                  </button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Posts */}
        <Card className="glass-card border-slate-200/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                المنشورات المجدولة
              </CardTitle>
              <Link to={createPageUrl('Schedule')}>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  عرض الكل
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingPosts.length > 0 ? (
              <div className="space-y-3">
                {pendingPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {new Date(post.scheduled_date).toLocaleDateString('en-GB')} {new Date(post.scheduled_date).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <div className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold">
                        قريباً
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">
                      {post.platform_ids?.length || 0} منصة
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-600 mb-4">لا توجد منشورات مجدولة</p>
                <Link to={createPageUrl('Schedule')}>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    جدولة نشر
                  </button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Content */}
      <Card className="glass-card border-slate-200/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              المحتوى الأخير
            </CardTitle>
            <Link to={createPageUrl('ContentLibrary')}>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                المكتبة الكاملة
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {content.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.slice(0, 6).map((item) => (
                <div 
                  key={item.id} 
                  className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    {item.status === 'published' && (
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.performance_views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {item.performance_engagement || 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">ابدأ رحلة المحتوى</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                أنشئ أول محتوى ذكي لك وشاهد كيف يمكن للذكاء الاصطناعي تحويل أفكارك إلى حملات ناجحة
              </p>
              <Link to={createPageUrl('CreateContent')}>
                <GradientButton icon={Sparkles}>
                  إنشاء المحتوى الأول
                </GradientButton>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}