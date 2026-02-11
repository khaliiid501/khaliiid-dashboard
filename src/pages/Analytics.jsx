import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  MousePointerClick,
  Calendar,
  Award,
  DollarSign,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  FileDown,
  Activity,
  BarChart3,
  Percent
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [isReportsDialogOpen, setIsReportsDialogOpen] = useState(false);

  const { data: allContent = [] } = useQuery({
    queryKey: ['analyticsContent'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Content.filter({ created_by: user.email });
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['analyticsCampaigns'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Campaign.filter({ created_by: user.email });
    },
  });

  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['analyticsScheduledPosts'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.ScheduledPost.filter({ created_by: user.email });
    },
  });

  const { data: platforms = [] } = useQuery({
    queryKey: ['analyticsPlatforms'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.ConnectedPlatform.filter({ created_by: user.email });
    },
  });

  const publishedContent = allContent.filter(c => c.status === 'published');
  
  const totalViews = publishedContent.reduce((sum, c) => sum + (c.performance_views || 0), 0);
  const totalEngagement = publishedContent.reduce((sum, c) => sum + (c.performance_engagement || 0), 0);
  const totalConversions = publishedContent.reduce((sum, c) => sum + (c.performance_conversions || 0), 0);
  const avgEngagement = publishedContent.length > 0 ? (totalEngagement / publishedContent.length).toFixed(2) : 0;

  // Campaign Analytics
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent_budget || 0), 0);
  const totalCampaignReach = campaigns.reduce((sum, c) => sum + (c.total_reach || 0), 0);
  const totalCampaignEngagement = campaigns.reduce((sum, c) => sum + (c.total_engagement || 0), 0);
  const totalCampaignConversions = campaigns.reduce((sum, c) => sum + (c.total_conversions || 0), 0);

  // Calculate ROI for each campaign
  const campaignsWithROI = campaigns.map(campaign => ({
    ...campaign,
    calculated_roi: campaign.spent_budget > 0 
      ? (((campaign.roi || 0) - campaign.spent_budget) / campaign.spent_budget * 100).toFixed(2)
      : 0,
    budget_utilization: campaign.budget > 0 
      ? ((campaign.spent_budget || 0) / campaign.budget * 100).toFixed(1)
      : 0
  })).sort((a, b) => b.calculated_roi - a.calculated_roi);

  // Platform Performance Analysis
  const platformPerformance = platforms.map(platform => {
    const platformPosts = scheduledPosts.filter(post => 
      post.platform_ids?.includes(platform.id) && post.status === 'published'
    );
    
    const platformContent = publishedContent.filter(content =>
      content.target_platforms?.includes(platform.platform_name)
    );

    const totalPlatformViews = platformContent.reduce((sum, c) => sum + (c.performance_views || 0), 0);
    const totalPlatformEngagement = platformContent.reduce((sum, c) => sum + (c.performance_engagement || 0), 0);
    const avgPlatformEngagement = platformContent.length > 0 
      ? (totalPlatformEngagement / platformContent.length).toFixed(2) 
      : 0;

    return {
      id: platform.id,
      name: platform.platform_name,
      account: platform.account_name,
      posts: platformPosts.length,
      content: platformContent.length,
      views: totalPlatformViews,
      engagement: parseFloat(avgPlatformEngagement),
      successRate: platformPosts.length > 0 
        ? ((platformPosts.filter(p => p.status === 'published').length / platformPosts.length) * 100).toFixed(1)
        : 0
    };
  }).sort((a, b) => b.engagement - a.engagement);

  // Campaign Comparison Data
  const campaignComparisonData = campaigns.slice(0, 5).map(campaign => ({
    name: campaign.campaign_name.substring(0, 15),
    ميزانية: campaign.budget || 0,
    مصروف: campaign.spent_budget || 0,
    وصول: campaign.total_reach || 0,
    تفاعل: campaign.total_engagement || 0,
    تحويلات: campaign.total_conversions || 0,
    roi: parseFloat(campaign.roi || 0)
  }));

  // Timeline data for trend analysis
  const timelineData = publishedContent
    .sort((a, b) => new Date(a.published_at) - new Date(b.published_at))
    .slice(-30) // Last 30 pieces of content
    .map(content => ({
      date: new Date(content.published_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
      مشاهدات: content.performance_views || 0,
      تفاعل: content.performance_engagement || 0,
      تحويلات: content.performance_conversions || 0
    }));

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

  // Additional KPIs
  const avgCampaignROI = campaigns.length > 0 
    ? (campaigns.reduce((sum, c) => sum + (c.roi || 0), 0) / campaigns.length).toFixed(2)
    : 0;
  
  const budgetUtilization = totalBudget > 0 
    ? ((totalSpent / totalBudget) * 100).toFixed(1)
    : 0;

  const conversionRate = totalCampaignReach > 0 
    ? ((totalCampaignConversions / totalCampaignReach) * 100).toFixed(2)
    : 0;

  const engagementRate = totalCampaignReach > 0 
    ? ((totalCampaignEngagement / totalCampaignReach) * 100).toFixed(2)
    : 0;

  // Generate Platform Performance Report
  const generatePlatformReport = () => {
    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Platform Performance Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US')}`, 105, 30, { align: 'center' });
    
    let yPos = 50;
    
    platformPerformance.forEach((platform, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`${index + 1}. ${platform.name}`, 20, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Account: ${platform.account}`, 25, yPos);
      
      yPos += 6;
      doc.text(`Posts: ${platform.posts} | Content: ${platform.content}`, 25, yPos);
      
      yPos += 6;
      doc.text(`Views: ${platform.views.toLocaleString()} | Engagement: ${platform.engagement}%`, 25, yPos);
      
      yPos += 6;
      doc.text(`Success Rate: ${platform.successRate}%`, 25, yPos);
      
      yPos += 12;
    });
    
    doc.save(`platform-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('تم تنزيل تقرير أداء المنصات');
  };

  // Generate Budget Report
  const generateBudgetReport = () => {
    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Budget vs Spending Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US')}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 20, 50);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Budget: ${totalBudget.toLocaleString()} SAR`, 25, 58);
    doc.text(`Total Spent: ${totalSpent.toLocaleString()} SAR`, 25, 64);
    doc.text(`Budget Utilization: ${budgetUtilization}%`, 25, 70);
    doc.text(`Remaining: ${(totalBudget - totalSpent).toLocaleString()} SAR`, 25, 76);
    
    let yPos = 90;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Campaign Details:', 20, yPos);
    
    yPos += 10;
    campaigns.forEach((campaign, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${index + 1}. ${campaign.campaign_name}`, 20, yPos);
      
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Budget: ${(campaign.budget || 0).toLocaleString()} SAR`, 25, yPos);
      
      yPos += 5;
      doc.text(`Spent: ${(campaign.spent_budget || 0).toLocaleString()} SAR`, 25, yPos);
      
      yPos += 5;
      const utilization = campaign.budget > 0 
        ? ((campaign.spent_budget || 0) / campaign.budget * 100).toFixed(1)
        : 0;
      doc.text(`Utilization: ${utilization}%`, 25, yPos);
      
      yPos += 5;
      doc.text(`ROI: ${campaign.roi || 0}%`, 25, yPos);
      
      yPos += 10;
    });
    
    doc.save(`budget-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('تم تنزيل تقرير الميزانية');
  };

  // Generate Comprehensive Dashboard Report
  const generateDashboardReport = () => {
    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Analytics Dashboard Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US')}`, 105, 30, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Key Performance Indicators', 20, 45);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let yPos = 55;
    
    doc.text(`Total Views: ${totalViews.toLocaleString()}`, 25, yPos);
    yPos += 6;
    doc.text(`Average Engagement: ${avgEngagement}%`, 25, yPos);
    yPos += 6;
    doc.text(`Total Conversions: ${totalConversions}`, 25, yPos);
    yPos += 6;
    doc.text(`Conversion Rate: ${conversionRate}%`, 25, yPos);
    yPos += 6;
    doc.text(`Engagement Rate: ${engagementRate}%`, 25, yPos);
    
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Campaign Metrics', 20, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Campaigns: ${campaigns.length}`, 25, yPos);
    yPos += 6;
    doc.text(`Active Campaigns: ${activeCampaigns.length}`, 25, yPos);
    yPos += 6;
    doc.text(`Total Budget: ${totalBudget.toLocaleString()} SAR`, 25, yPos);
    yPos += 6;
    doc.text(`Total Spent: ${totalSpent.toLocaleString()} SAR`, 25, yPos);
    yPos += 6;
    doc.text(`Budget Utilization: ${budgetUtilization}%`, 25, yPos);
    yPos += 6;
    doc.text(`Average Campaign ROI: ${avgCampaignROI}%`, 25, yPos);
    yPos += 6;
    doc.text(`Total Campaign Reach: ${totalCampaignReach.toLocaleString()}`, 25, yPos);
    
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Platform Performance', 20, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Connected Platforms: ${platforms.length}`, 25, yPos);
    yPos += 6;
    doc.text(`Published Content: ${publishedContent.length}`, 25, yPos);
    
    yPos += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Top Performing Platforms:', 20, yPos);
    
    yPos += 8;
    platformPerformance.slice(0, 5).forEach((platform, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${index + 1}. ${platform.name}: ${platform.engagement}% engagement`, 25, yPos);
      yPos += 5;
    });
    
    doc.save(`dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('تم تنزيل تقرير لوحة التحكم');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">التحليلات والإحصائيات</h1>
          <p className="text-slate-600">تتبع أداء محتواك وتحليل النتائج</p>
        </div>
        <Button onClick={() => setIsReportsDialogOpen(true)} variant="outline">
          <FileDown className="w-4 h-4 ml-2" />
          تقارير متقدمة
        </Button>
      </div>

      {/* Reports Dialog */}
      <Dialog open={isReportsDialogOpen} onOpenChange={setIsReportsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>التقارير المتقدمة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Card 
              className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-blue-500"
              onClick={generateDashboardReport}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">تقرير لوحة التحكم الشامل</h3>
                    <p className="text-sm text-slate-600">
                      تقرير كامل لجميع المؤشرات الرئيسية وأداء الحملات والمنصات
                    </p>
                  </div>
                  <FileDown className="w-5 h-5 text-blue-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-emerald-500"
              onClick={generatePlatformReport}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">تقرير أداء المنصات</h3>
                    <p className="text-sm text-slate-600">
                      تحليل مفصل لأداء كل منصة مع المقاييس والإحصائيات
                    </p>
                  </div>
                  <FileDown className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-amber-500"
              onClick={generateBudgetReport}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">تقرير الميزانية مقابل المصروف</h3>
                    <p className="text-sm text-slate-600">
                      تقرير مالي شامل يوضح الميزانيات والمصروفات وعائد الاستثمار
                    </p>
                  </div>
                  <FileDown className="w-5 h-5 text-amber-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Dashboard - KPI Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">لوحة التحكم الرئيسية</h2>
        
        {/* Primary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">إجمالي المشاهدات</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{totalViews.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">من {publishedContent.length} محتوى منشور</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">معدل التفاعل</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{engagementRate}%</p>
                  <p className="text-xs text-slate-500 mt-1">من إجمالي {totalCampaignReach.toLocaleString()} وصول</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-100">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">معدل التحويل</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{conversionRate}%</p>
                  <p className="text-xs text-slate-500 mt-1">{totalCampaignConversions} تحويلات</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-100">
                  <Percent className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">متوسط ROI</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{avgCampaignROI}%</p>
                  <p className="text-xs text-slate-500 mt-1">لـ {campaigns.length} حملات</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign & Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                نظرة عامة على الميزانية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">إجمالي الميزانية</span>
                  <span className="text-lg font-bold text-slate-900">{totalBudget.toLocaleString()} ر.س</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">المصروف</span>
                  <span className="text-lg font-bold text-amber-600">{totalSpent.toLocaleString()} ر.س</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">المتبقي</span>
                  <span className="text-lg font-bold text-emerald-600">{(totalBudget - totalSpent).toLocaleString()} ر.س</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">نسبة الاستخدام</span>
                  <span className="font-semibold">{budgetUtilization}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      parseFloat(budgetUtilization) > 90 ? 'bg-red-500' :
                      parseFloat(budgetUtilization) > 70 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(parseFloat(budgetUtilization), 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">حملات نشطة</span>
                  <Badge className="bg-blue-100 text-blue-700">{activeCampaigns.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                أداء الحملات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">إجمالي الوصول</p>
                  <p className="text-xl font-bold text-blue-600">{totalCampaignReach.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">التفاعل</p>
                  <p className="text-xl font-bold text-emerald-600">{totalCampaignEngagement.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">التحويلات</p>
                  <p className="text-xl font-bold text-amber-600">{totalCampaignConversions}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">منصات متصلة</p>
                  <p className="text-xl font-bold text-purple-600">{platforms.length}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-slate-600 mb-2">أفضل 3 منصات بالأداء</p>
                <div className="space-y-2">
                  {platformPerformance.slice(0, 3).map((platform, idx) => (
                    <div key={platform.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <span className="text-slate-700">{platform.name}</span>
                      </div>
                      <span className="font-semibold text-emerald-600">{platform.engagement}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="campaigns">الحملات</TabsTrigger>
          <TabsTrigger value="platforms">المنصات</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
          <TabsTrigger value="performance">أداء المحتوى</TabsTrigger>
          <TabsTrigger value="distribution">توزيع المحتوى</TabsTrigger>
        </TabsList>

        {/* Campaign Analytics Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {/* Campaign Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">إجمالي الميزانية</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{totalBudget.toLocaleString()} ر.س</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">المصروف</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{totalSpent.toLocaleString()} ر.س</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-100">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">إجمالي الوصول</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{totalCampaignReach.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-100">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">حملات نشطة</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{activeCampaigns.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-100">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>مقارنة أداء الحملات</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={campaignComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="وصول" fill="#0ea5e9" />
                    <Bar dataKey="تفاعل" fill="#10b981" />
                    <Bar dataKey="تحويلات" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-12 text-center text-slate-600">
                  <Target className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p>لا توجد حملات بعد</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ROI Table */}
          <Card>
            <CardHeader>
              <CardTitle>عائد الاستثمار (ROI) للحملات</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignsWithROI.length > 0 ? (
                <div className="space-y-3">
                  {campaignsWithROI.map((campaign) => (
                    <div key={campaign.id} className="p-4 rounded-lg border hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{campaign.campaign_name}</h4>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                              {campaign.status === 'active' ? 'نشطة' : campaign.status}
                            </Badge>
                            <span className="text-sm text-slate-600">
                              الهدف: {campaign.campaign_goal}
                            </span>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className={`flex items-center gap-1 text-lg font-bold ${
                            parseFloat(campaign.calculated_roi) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {parseFloat(campaign.calculated_roi) >= 0 ? (
                              <ArrowUpRight className="w-5 h-5" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5" />
                            )}
                            {campaign.calculated_roi}%
                          </div>
                          <p className="text-xs text-slate-600 mt-1">ROI</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div>
                          <p className="text-slate-600">الميزانية</p>
                          <p className="font-semibold">{(campaign.budget || 0).toLocaleString()} ر.س</p>
                        </div>
                        <div>
                          <p className="text-slate-600">المصروف</p>
                          <p className="font-semibold">{(campaign.spent_budget || 0).toLocaleString()} ر.س</p>
                        </div>
                        <div>
                          <p className="text-slate-600">الوصول</p>
                          <p className="font-semibold">{(campaign.total_reach || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">التفاعل</p>
                          <p className="font-semibold">{(campaign.total_engagement || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">التحويلات</p>
                          <p className="font-semibold">{(campaign.total_conversions || 0)}</p>
                        </div>
                      </div>

                      {/* Budget Utilization Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span>استخدام الميزانية</span>
                          <span>{campaign.budget_utilization}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-l from-blue-500 to-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(parseFloat(campaign.budget_utilization), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-600">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p>لا توجد حملات لعرض ROI</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Performance Tab */}
        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحليل أداء المنصات</CardTitle>
            </CardHeader>
            <CardContent>
              {platformPerformance.length > 0 ? (
                <div className="space-y-3">
                  {platformPerformance.map((platform, index) => (
                    <div key={platform.id} className="p-4 rounded-lg border hover:shadow-md transition-all">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{platform.name}</h4>
                          <p className="text-sm text-slate-600">{platform.account}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          {platform.engagement}% تفاعل
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <p className="text-slate-600 mb-1">منشورات</p>
                          <p className="text-lg font-bold text-slate-900">{platform.posts}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <p className="text-slate-600 mb-1">محتوى</p>
                          <p className="text-lg font-bold text-slate-900">{platform.content}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <p className="text-slate-600 mb-1">مشاهدات</p>
                          <p className="text-lg font-bold text-slate-900">{platform.views.toLocaleString()}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <p className="text-slate-600 mb-1">نجاح</p>
                          <p className="text-lg font-bold text-slate-900">{platform.successRate}%</p>
                        </div>
                      </div>

                      {/* Performance Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span>معدل الأداء</span>
                          <span>{platform.engagement}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-l from-emerald-500 to-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(parseFloat(platform.engagement), 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-600">
                  <Target className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p>لا توجد منصات متصلة</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>توزيع الأداء حسب المنصة</CardTitle>
            </CardHeader>
            <CardContent>
              {platformPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" name="مشاهدات" fill="#0ea5e9" />
                    <Bar dataKey="posts" name="منشورات" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-12 text-center text-slate-600">لا توجد بيانات</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Over Time Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الاتجاهات بمرور الوقت</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="مشاهدات" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" dataKey="تفاعل" stroke="#10b981" fillOpacity={1} fill="url(#colorEngagement)" />
                    <Area type="monotone" dataKey="تحويلات" stroke="#f59e0b" fillOpacity={1} fill="url(#colorConversions)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-12 text-center text-slate-600">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p>لا توجد بيانات كافية لعرض الاتجاهات</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campaign Budget vs Spent Trend */}
          <Card>
            <CardHeader>
              <CardTitle>اتجاه الميزانية والإنفاق للحملات</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={campaignComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ميزانية" stroke="#0ea5e9" strokeWidth={3} />
                    <Line type="monotone" dataKey="مصروف" stroke="#ef4444" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-12 text-center text-slate-600">لا توجد بيانات</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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