import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  MousePointerClick,
  Calendar,
  Award
} from 'lucide-react';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const { data: allContent = [] } = useQuery({
    queryKey: ['analyticsContent'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Content.filter({ created_by: user.email });
    },
  });

  const publishedContent = allContent.filter(c => c.status === 'published');
  
  const totalViews = publishedContent.reduce((sum, c) => sum + (c.performance_views || 0), 0);
  const totalEngagement = publishedContent.reduce((sum, c) => sum + (c.performance_engagement || 0), 0);
  const totalConversions = publishedContent.reduce((sum, c) => sum + (c.performance_conversions || 0), 0);
  const avgEngagement = publishedContent.length > 0 ? (totalEngagement / publishedContent.length).toFixed(2) : 0;

  // Content by status
  const contentByStatus = [
    { name: 'منشور', value: allContent.filter(c => c.status === 'published').length },
    { name: 'معتمد', value: allContent.filter(c => c.status === 'approved').length },
    { name: 'مسودة', value: allContent.filter(c => c.status === 'draft').length },
  ].filter(item => item.value > 0);

  // Performance over time (last 7 content)
  const performanceData = publishedContent
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(0, 7)
    .reverse()
    .map(content => ({
      name: content.title.substring(0, 15) + '...',
      مشاهدات: content.performance_views || 0,
      تفاعل: content.performance_engagement || 0,
      تحويلات: content.performance_conversions || 0
    }));

  // Top performing content
  const topContent = [...publishedContent]
    .sort((a, b) => (b.performance_views + b.performance_engagement * 10) - (a.performance_views + a.performance_engagement * 10))
    .slice(0, 5);

  // Content by type
  const contentByType = [
    { name: 'من فكرة', value: allContent.filter(c => c.content_type === 'idea').length },
    { name: 'من رابط', value: allContent.filter(c => c.content_type === 'product_url').length },
  ].filter(item => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">التحليلات والإحصائيات</h1>
        <p className="text-slate-600">تتبع أداء محتواك وتحليل النتائج</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">إجمالي المشاهدات</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalViews.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">متوسط التفاعل</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{avgEngagement}%</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-100">
                <Heart className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">التحويلات</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalConversions}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-100">
                <MousePointerClick className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">محتوى منشور</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{publishedContent.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">أداء المحتوى</TabsTrigger>
          <TabsTrigger value="distribution">توزيع المحتوى</TabsTrigger>
          <TabsTrigger value="top">الأفضل أداءً</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أداء المحتوى الأخير</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="مشاهدات" stroke="#0ea5e9" strokeWidth={2} />
                    <Line type="monotone" dataKey="تفاعل" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="تحويلات" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-12 text-center text-slate-600">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p>لا توجد بيانات أداء بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>حسب الحالة</CardTitle>
              </CardHeader>
              <CardContent>
                {contentByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={contentByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {contentByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-12 text-center text-slate-600">لا توجد بيانات</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>حسب النوع</CardTitle>
              </CardHeader>
              <CardContent>
                {contentByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={contentByType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-12 text-center text-slate-600">لا توجد بيانات</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="top" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المحتوى الأفضل أداءً</CardTitle>
            </CardHeader>
            <CardContent>
              {topContent.length > 0 ? (
                <div className="space-y-3">
                  {topContent.map((content, index) => (
                    <div key={content.id} className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{content.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {content.performance_views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {content.performance_engagement || 0}%
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="w-4 h-4" />
                            {content.performance_conversions || 0}
                          </span>
                        </div>
                      </div>
                      <Award className="w-5 h-5 text-amber-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-600">
                  <Award className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p>لا يوجد محتوى منشور بعد</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}