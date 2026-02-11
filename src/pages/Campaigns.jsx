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
  Eye
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
  const draftCampaigns = campaigns.filter(c => c.status === 'draft');
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent_budget || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">إدارة الحملات</h1>
          <p className="text-slate-600">أنشئ وأدر حملاتك التسويقية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} size="lg">
              <Plus className="w-5 h-5 ml-2" />
              حملة جديدة
            </Button>
          </DialogTrigger>
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">إجمالي الحملات</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{campaigns.length}</p>
              </div>
              <Megaphone className="w-8 h-8 text-blue-600" />
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
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">إجمالي الميزانية</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalBudget.toLocaleString()} ر.س</p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-600" />
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
              <TrendingUp className="w-8 h-8 text-purple-600" />
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
              <Card key={campaign.id} className="hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-blue-50">
                        <GoalIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{campaign.campaign_name}</CardTitle>
                        {campaign.campaign_description && (
                          <p className="text-sm text-slate-600 mb-3">{campaign.campaign_description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getStatusColor(campaign.status)}>
                            {getStatusLabel(campaign.status)}
                          </Badge>
                          <Badge variant="outline">
                            {campaignGoals[campaign.campaign_goal]?.label}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(campaign.start_date).toLocaleDateString('ar-SA')} - {new Date(campaign.end_date).toLocaleDateString('ar-SA')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-xs text-slate-600">الوصول</p>
                      <p className="text-lg font-bold text-slate-900">{campaign.total_reach?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">التفاعل</p>
                      <p className="text-lg font-bold text-slate-900">{campaign.total_engagement || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">التحويلات</p>
                      <p className="text-lg font-bold text-slate-900">{campaign.total_conversions || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">ROI</p>
                      <p className="text-lg font-bold text-slate-900">{campaign.roi || 0}%</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">الميزانية</span>
                      <span className="text-sm font-medium text-slate-900">
                        {campaign.spent_budget?.toLocaleString() || 0} / {campaign.budget?.toLocaleString() || 0} ر.س
                      </span>
                    </div>
                    <Progress value={budgetProgress} className="h-2" />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {campaign.selected_platforms?.map((platform) => (
                      <Badge key={platform} variant="secondary" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>

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