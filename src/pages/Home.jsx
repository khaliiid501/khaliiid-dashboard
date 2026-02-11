import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  CheckCircle,
  Clock,
  Eye,
  Heart,
  ShoppingCart,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const subs = await base44.entities.Subscription.filter({ user_email: user.email });
      return subs[0] || null;
    },
  });

  const { data: recentContent = [] } = useQuery({
    queryKey: ['recentContent'],
    queryFn: () => base44.entities.Content.list('-created_date', 5),
  });

  const { data: stats } = useQuery({
    queryKey: ['contentStats'],
    queryFn: async () => {
      const allContent = await base44.entities.Content.list();
      const published = allContent.filter(c => c.status === 'published');
      const totalViews = published.reduce((sum, c) => sum + (c.performance_views || 0), 0);
      const totalEngagement = published.reduce((sum, c) => sum + (c.performance_engagement || 0), 0);
      const totalConversions = published.reduce((sum, c) => sum + (c.performance_conversions || 0), 0);
      
      return {
        totalContent: allContent.length,
        published: published.length,
        draft: allContent.filter(c => c.status === 'draft').length,
        views: totalViews,
        engagement: published.length > 0 ? (totalEngagement / published.length).toFixed(1) : 0,
        conversions: totalConversions,
      };
    },
  });

  const planNames = {
    basic: 'الأساسية',
    professional: 'الاحترافية',
    premium: 'المتقدمة'
  };

  const usagePercentage = subscription && subscription.content_quota > 0
    ? (subscription.content_used / subscription.content_quota) * 100
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">مرحباً بك في لوحة التحكم</h1>
        <p className="text-slate-600">أنشئ محتوى إعلاني قوي يتصدر محركات البحث في السعودية</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to={createPageUrl('CreateContent')}>
          <Card className="cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-emerald-500 bg-gradient-to-br from-emerald-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">إنشاء محتوى جديد</h3>
                  <p className="text-sm text-slate-600">ابدأ بتوليد محتوى ذكي الآن</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('Trends')}>
          <Card className="cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">استكشف الترندات</h3>
                  <p className="text-sm text-slate-600">شاهد ما يتصدر في السعودية</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('Analytics')}>
          <Card className="cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">التحليلات والأداء</h3>
                  <p className="text-sm text-slate-600">تابع نجاح محتواك</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">اشتراكك الحالي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white">
              <p className="text-sm opacity-90">الباقة الحالية</p>
              <h3 className="text-2xl font-bold mt-1">
                {subscription ? planNames[subscription.plan_type] : 'لا يوجد'}
              </h3>
            </div>

            {subscription && subscription.content_quota > 0 && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">الاستخدام الشهري</span>
                  <span className="font-bold text-slate-900">
                    {subscription.content_used} / {subscription.content_quota}
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>
            )}

            {subscription && subscription.content_quota === -1 && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-700 font-medium">✨ محتوى غير محدود</p>
              </div>
            )}

            <Link to={createPageUrl('Pricing')}>
              <Button variant="outline" className="w-full">
                إدارة الاشتراك
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">إجمالي المحتوى</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.totalContent || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">منشور</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.published || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">المشاهدات</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.views || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-100">
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">معدل التفاعل</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.engagement || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <ShoppingCart className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">التحويلات</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.conversions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>المحتوى الأخير</CardTitle>
            <Link to={createPageUrl('ContentLibrary')}>
              <Button variant="ghost" size="sm">
                عرض الكل
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentContent.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">لم تنشئ أي محتوى بعد</p>
              <Link to={createPageUrl('CreateContent')}>
                <Button>ابدأ بإنشاء محتوى جديد</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContent.map((content) => (
                <div
                  key={content.id}
                  className="p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 mb-1">{content.title}</h4>
                      <p className="text-sm text-slate-600 line-clamp-2">{content.content_text}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {content.performance_views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {content.performance_engagement || 0}%
                        </span>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        content.status === 'published' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : content.status === 'approved'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {content.status === 'published' ? 'منشور' : content.status === 'approved' ? 'معتمد' : 'مسودة'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}