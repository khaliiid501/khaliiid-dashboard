import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Megaphone, 
  Plus, 
  Play,
  Pause,
  CheckCircle,
  Edit3,
  Trash2,
  Target,
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  Eye,
  Upload,
  FileDown,
  Settings,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

const campaignGoals = {
  awareness: { label: 'زيادة الوعي', icon: Eye, color: 'blue' },
  engagement: { label: 'التفاعل', icon: Users, color: 'emerald' },
  conversions: { label: 'التحويلات', icon: Target, color: 'purple' },
  sales: { label: 'المبيعات', icon: DollarSign, color: 'amber' },
  traffic: { label: 'زيادة الزيارات', icon: TrendingUp, color: 'rose' }
};

export default function Campaigns() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isColumnsDialogOpen, setIsColumnsDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    goal: true,
    dates: true,
    budget: true,
    reach: true,
    engagement: true,
    conversions: true,
    roi: true,
    platforms: true
  });
  const [formData, setFormData] = useState({
    campaign_name: '',
    campaign_description: '',
    campaign_goal: 'awareness',
    target_audience: {
      age_range: '',
      gender: '',
      location: '',
      interests: []
    },
    selected_platforms: [],
    content_ids: [],
    budget: 0,
    start_date: '',
    end_date: ''
  });

  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Campaign.filter({ created_by: user.email }, '-created_date');
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const subs = await base44.entities.Subscription.filter({ user_email: user.email });
      return subs[0] || null;
    },
  });

  const { data: connectedPlatforms = [] } = useQuery({
    queryKey: ['connectedPlatforms'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.ConnectedPlatform.filter({ created_by: user.email });
    },
  });

  const { data: allContent = [] } = useQuery({
    queryKey: ['allContent'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Content.filter({ created_by: user.email });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Campaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      setIsDialogOpen(false);
      resetForm();
      toast.success('تم إنشاء الحملة بنجاح');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Campaign.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      setIsDialogOpen(false);
      setEditingCampaign(null);
      resetForm();
      toast.success('تم تحديث الحملة بنجاح');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Campaign.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      toast.success('تم حذف الحملة');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Campaign.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
    }
  });

  const importMutation = useMutation({
    mutationFn: async (file) => {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadResult.file_url,
        json_schema: {
          type: "object",
          properties: {
            campaign_name: { type: "string" },
            campaign_description: { type: "string" },
            campaign_goal: { type: "string" },
            budget: { type: "number" },
            start_date: { type: "string" },
            end_date: { type: "string" },
            selected_platforms: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (extractResult.status === 'error') {
        throw new Error(extractResult.details);
      }

      const campaignsData = Array.isArray(extractResult.output) ? extractResult.output : [extractResult.output];
      await base44.entities.Campaign.bulkCreate(
        campaignsData.map(c => ({
          ...c,
          status: 'draft',
          target_audience: {},
          content_ids: [],
          selected_platforms: c.selected_platforms || []
        }))
      );

      return campaignsData.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries(['campaigns']);
      setIsImportDialogOpen(false);
      setImportFile(null);
      toast.success(`تم استيراد ${count} حملة بنجاح`);
    },
    onError: (error) => {
      toast.error('فشل الاستيراد: ' + error.message);
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportType) => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthlyCampaigns = campaigns.filter(c => {
        const startDate = new Date(c.start_date);
        return startDate >= monthStart && startDate <= monthEnd;
      });

      const report = {
        report_type: reportType,
        generated_date: now.toISOString(),
        period: `${monthStart.toLocaleDateString('en-GB')} - ${monthEnd.toLocaleDateString('en-GB')}`,
        total_campaigns: monthlyCampaigns.length,
        active_campaigns: monthlyCampaigns.filter(c => c.status === 'active').length,
        total_budget: monthlyCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
        total_spent: monthlyCampaigns.reduce((sum, c) => sum + (c.spent_budget || 0), 0),
        total_reach: monthlyCampaigns.reduce((sum, c) => sum + (c.total_reach || 0), 0),
        total_engagement: monthlyCampaigns.reduce((sum, c) => sum + (c.total_engagement || 0), 0),
        total_conversions: monthlyCampaigns.reduce((sum, c) => sum + (c.total_conversions || 0), 0),
        avg_roi: monthlyCampaigns.length > 0 
          ? (monthlyCampaigns.reduce((sum, c) => sum + (c.roi || 0), 0) / monthlyCampaigns.length).toFixed(2)
          : 0,
        campaigns: monthlyCampaigns.map(c => ({
          name: c.campaign_name,
          goal: c.campaign_goal,
          budget: c.budget,
          spent: c.spent_budget,
          reach: c.total_reach,
          engagement: c.total_engagement,
          conversions: c.total_conversions,
          roi: c.roi
        }))
      };

      const reportText = `تقرير الأداء الشهري
=====================

الفترة: ${report.period}
تاريخ التوليد: ${new Date(report.generated_date).toLocaleDateString('en-GB')}

📊 ملخص عام:
- إجمالي الحملات: ${report.total_campaigns}
- حملات نشطة: ${report.active_campaigns}
- إجمالي الميزانية: ${report.total_budget.toLocaleString()} ر.س
- إجمالي المصروف: ${report.total_spent.toLocaleString()} ر.س

📈 الأداء:
- إجمالي الوصول: ${report.total_reach.toLocaleString()}
- إجمالي التفاعل: ${report.total_engagement.toLocaleString()}
- إجمالي التحويلات: ${report.total_conversions}
- متوسط ROI: ${report.avg_roi}%

📋 تفاصيل الحملات:
${report.campaigns.map((c, i) => `${i + 1}. ${c.name}
   الهدف: ${c.goal}
   الميزانية: ${(c.budget || 0).toLocaleString()} ر.س
   المصروف: ${(c.spent || 0).toLocaleString()} ر.س
   الوصول: ${(c.reach || 0).toLocaleString()}
   التفاعل: ${c.engagement || 0}
   التحويلات: ${c.conversions || 0}
   ROI: ${c.roi || 0}%`).join('\n\n')}`;

      return { report, reportText };
    },
    onSuccess: ({ report, reportText }) => {
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `تقرير-الحملات-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      setIsReportDialogOpen(false);
      toast.success('تم توليد التقرير وتنزيله');
    }
  });

  const handleImport = () => {
    if (!importFile) {
      toast.error('الرجاء اختيار ملف CSV');
      return;
    }
    importMutation.mutate(importFile);
  };

  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const resetForm = () => {
    setFormData({
      campaign_name: '',
      campaign_description: '',
      campaign_goal: 'awareness',
      target_audience: {
        age_range: '',
        gender: '',
        location: '',
        interests: []
      },
      selected_platforms: [],
      content_ids: [],
      budget: 0,
      start_date: '',
      end_date: ''
    });
    setEditingCampaign(null);
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      campaign_name: campaign.campaign_name,
      campaign_description: campaign.campaign_description || '',
      campaign_goal: campaign.campaign_goal,
      target_audience: campaign.target_audience || { age_range: '', gender: '', location: '', interests: [] },
      selected_platforms: campaign.selected_platforms || [],
      content_ids: campaign.content_ids || [],
      budget: campaign.budget || 0,
      start_date: campaign.start_date,
      end_date: campaign.end_date
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.campaign_name.trim() || formData.selected_platforms.length === 0) {
      toast.error('الرجاء إدخال اسم الحملة واختيار منصة واحدة على الأقل');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error('الرجاء تحديد تاريخ البدء والانتهاء');
      return;
    }

    const data = {
      ...formData,
      status: editingCampaign ? editingCampaign.status : 'draft'
    };

    if (editingCampaign) {
      updateMutation.mutate({ id: editingCampaign.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const togglePlatform = (platform) => {
    setFormData(prev => ({
      ...prev,
      selected_platforms: prev.selected_platforms.includes(platform)
        ? prev.selected_platforms.filter(p => p !== platform)
        : [...prev.selected_platforms, platform]
    }));
  };

  const toggleContent = (contentId) => {
    setFormData(prev => ({
      ...prev,
      content_ids: prev.content_ids.includes(contentId)
        ? prev.content_ids.filter(id => id !== contentId)
        : [...prev.content_ids, contentId]
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-amber-100 text-amber-700',
      completed: 'bg-blue-100 text-blue-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'مسودة',
      active: 'نشطة',
      paused: 'متوقفة',
      completed: 'مكتملة'
    };
    return labels[status] || status;
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent_budget || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">إدارة الحملات</h1>
          <p className="text-slate-600 text-lg">أنشئ وأدر حملاتك التسويقية باحترافية</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setIsColumnsDialogOpen(true)} variant="outline">
            <Settings className="w-4 h-4 ml-2" />
            الأعمدة
          </Button>
          <Button onClick={() => setIsReportDialogOpen(true)} variant="outline">
            <FileDown className="w-4 h-4 ml-2" />
            تقرير
          </Button>
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
            <Upload className="w-4 h-4 ml-2" />
            استيراد
          </Button>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-5 h-5 ml-2" />
            حملة جديدة
          </Button>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استيراد حملات من CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                اختر ملف CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg text-sm">
              <p className="font-medium text-slate-900 mb-2">تنسيق الملف المطلوب:</p>
              <code className="text-xs bg-white p-2 block rounded">
                campaign_name, campaign_description, campaign_goal, budget, start_date, end_date, selected_platforms
              </code>
              <p className="text-xs text-slate-600 mt-2">
                مثال: "حملة الصيف","عرض صيفي","sales",5000,"2026-06-01","2026-08-31","instagram,twitter"
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending || !importFile}
                className="flex-1"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الاستيراد...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-2" />
                    استيراد
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reports Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>نماذج التقارير الجاهزة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Card 
              className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-blue-500"
              onClick={() => generateReportMutation.mutate('monthly')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">تقرير الأداء الشهري</h3>
                    <p className="text-sm text-slate-600">
                      ملخص شامل لأداء الحملات خلال الشهر الحالي
                    </p>
                  </div>
                  <FileDown className="w-5 h-5 text-blue-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-emerald-500"
              onClick={() => {
                const csvContent = [
                  ['اسم الحملة', 'الهدف', 'الحالة', 'الميزانية', 'المصروف', 'الوصول', 'التفاعل', 'التحويلات', 'ROI'],
                  ...campaigns.map(c => [
                    c.campaign_name,
                    c.campaign_goal,
                    c.status,
                    c.budget || 0,
                    c.spent_budget || 0,
                    c.total_reach || 0,
                    c.total_engagement || 0,
                    c.total_conversions || 0,
                    c.roi || 0
                  ])
                ].map(row => row.join(',')).join('\n');

                const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `جميع-الحملات-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                
                toast.success('تم تصدير البيانات');
                setIsReportDialogOpen(false);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">تصدير جميع الحملات (CSV)</h3>
                    <p className="text-sm text-slate-600">
                      تصدير بيانات جميع الحملات بصيغة CSV
                    </p>
                  </div>
                  <FileDown className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Columns Customization Dialog */}
      <Dialog open={isColumnsDialogOpen} onOpenChange={setIsColumnsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تخصيص الأعمدة المعروضة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {[
              { key: 'name', label: 'اسم الحملة' },
              { key: 'goal', label: 'الهدف' },
              { key: 'dates', label: 'التواريخ' },
              { key: 'budget', label: 'الميزانية' },
              { key: 'reach', label: 'الوصول' },
              { key: 'engagement', label: 'التفاعل' },
              { key: 'conversions', label: 'التحويلات' },
              { key: 'roi', label: 'ROI' },
              { key: 'platforms', label: 'المنصات' }
            ].map(col => (
              <div key={col.key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={visibleColumns[col.key]}
                  onChange={() => toggleColumn(col.key)}
                  className="rounded"
                />
                <label className="text-sm text-slate-700 cursor-pointer flex-1">
                  {col.label}
                </label>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsColumnsDialogOpen(false)}
              className="flex-1"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Campaign Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'تعديل الحملة' : 'إنشاء حملة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                اسم الحملة *
              </label>
              <Input
                value={formData.campaign_name}
                onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                placeholder="مثال: حملة الصيف 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                وصف الحملة
              </label>
              <Textarea
                value={formData.campaign_description}
                onChange={(e) => setFormData({ ...formData, campaign_description: e.target.value })}
                placeholder="اكتب وصفاً مختصراً للحملة..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                هدف الحملة *
              </label>
              <Select value={formData.campaign_goal} onValueChange={(value) => setFormData({ ...formData, campaign_goal: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(campaignGoals).map(([key, goal]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {React.createElement(goal.icon, { className: "w-4 h-4" })}
                        {goal.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  تاريخ البدء *
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  تاريخ الانتهاء *
                </label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                الميزانية (ريال سعودي)
              </label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                المنصات المستهدفة *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {connectedPlatforms.filter(p => p.is_active).map((platform) => (
                  <Button
                    key={platform.id}
                    type="button"
                    variant={formData.selected_platforms.includes(platform.platform_name) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => togglePlatform(platform.platform_name)}
                    className="justify-start"
                  >
                    {formData.selected_platforms.includes(platform.platform_name) && (
                      <CheckCircle className="w-4 h-4 ml-2" />
                    )}
                    {platform.account_name}
                  </Button>
                ))}
              </div>
              {connectedPlatforms.filter(p => p.is_active).length === 0 && (
                <p className="text-sm text-slate-500">لا توجد منصات متصلة. قم بربط المنصات من الإعدادات</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                اختر المحتوى للحملة (اختياري)
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
                {allContent.filter(c => c.status !== 'draft').slice(0, 10).map((content) => (
                  <div key={content.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.content_ids.includes(content.id)}
                      onChange={() => toggleContent(content.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700">{content.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                الجمهور المستهدف (اختياري)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="الفئة العمرية (مثال: 18-35)"
                  value={formData.target_audience.age_range}
                  onChange={(e) => setFormData({
                    ...formData,
                    target_audience: { ...formData.target_audience, age_range: e.target.value }
                  })}
                />
                <Select
                  value={formData.target_audience.gender}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    target_audience: { ...formData.target_audience, gender: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="male">ذكور</SelectItem>
                    <SelectItem value="female">إناث</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="الموقع"
                  value={formData.target_audience.location}
                  onChange={(e) => setFormData({
                    ...formData,
                    target_audience: { ...formData.target_audience, location: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {editingCampaign ? 'حفظ التعديلات' : 'إنشاء الحملة'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-l-4 border-l-blue-500 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">إجمالي الحملات</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 font-mono">{campaigns.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-100">
                <Megaphone className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-emerald-500 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">حملات نشطة</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 font-mono">{activeCampaigns.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-100">
                <Play className="w-7 h-7 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-amber-500 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">إجمالي الميزانية</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 font-mono">{totalBudget.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">ر.س</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-100">
                <DollarSign className="w-7 h-7 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-purple-500 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">المصروف</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 font-mono">{totalSpent.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">ر.س</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-100">
                <TrendingUp className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">لا توجد حملات بعد</h3>
            <p className="text-slate-600 mb-6">ابدأ بإنشاء حملتك التسويقية الأولى</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء حملة جديدة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const GoalIcon = campaignGoals[campaign.campaign_goal]?.icon || Target;
            const budgetProgress = campaign.budget > 0 ? (campaign.spent_budget / campaign.budget) * 100 : 0;
            
            return (
              <Card key={campaign.id} className="glass-card hover-lift border-slate-200/50 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-blue-500 to-emerald-500" />
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-blue-50">
                        <GoalIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        {visibleColumns.name && (
                          <CardTitle className="text-xl mb-2">{campaign.campaign_name}</CardTitle>
                        )}
                        {campaign.campaign_description && (
                          <p className="text-sm text-slate-600 mb-3">{campaign.campaign_description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getStatusColor(campaign.status)}>
                            {getStatusLabel(campaign.status)}
                          </Badge>
                          {visibleColumns.goal && (
                            <Badge variant="outline">
                              {campaignGoals[campaign.campaign_goal]?.label}
                            </Badge>
                          )}
                          {visibleColumns.dates && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(campaign.start_date).toLocaleDateString('en-GB')} - {new Date(campaign.end_date).toLocaleDateString('en-GB')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50">
                    {visibleColumns.reach && (
                      <div>
                        <p className="text-xs text-slate-600">الوصول</p>
                        <p className="text-lg font-bold text-slate-900">{campaign.total_reach?.toLocaleString() || 0}</p>
                      </div>
                    )}
                    {visibleColumns.engagement && (
                      <div>
                        <p className="text-xs text-slate-600">التفاعل</p>
                        <p className="text-lg font-bold text-slate-900">{campaign.total_engagement || 0}</p>
                      </div>
                    )}
                    {visibleColumns.conversions && (
                      <div>
                        <p className="text-xs text-slate-600">التحويلات</p>
                        <p className="text-lg font-bold text-slate-900">{campaign.total_conversions || 0}</p>
                      </div>
                    )}
                    {visibleColumns.roi && (
                      <div>
                        <p className="text-xs text-slate-600">ROI</p>
                        <p className="text-lg font-bold text-slate-900">{campaign.roi || 0}%</p>
                      </div>
                    )}
                  </div>

                  {visibleColumns.budget && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">الميزانية</span>
                        <span className="text-sm font-medium text-slate-900">
                          {campaign.spent_budget?.toLocaleString() || 0} / {campaign.budget?.toLocaleString() || 0} ر.س
                        </span>
                      </div>
                      <Progress value={budgetProgress} className="h-2" />
                    </div>
                  )}

                  {visibleColumns.platforms && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {campaign.selected_platforms?.map((platform) => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    {campaign.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: 'active' })}
                      >
                        <Play className="w-4 h-4 ml-1" />
                        تفعيل
                      </Button>
                    )}
                    {campaign.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: 'paused' })}
                      >
                        <Pause className="w-4 h-4 ml-1" />
                        إيقاف مؤقت
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: 'active' })}
                      >
                        <Play className="w-4 h-4 ml-1" />
                        استئناف
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(campaign)}
                    >
                      <Edit3 className="w-4 h-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذه الحملة؟')) {
                          deleteMutation.mutate(campaign.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}