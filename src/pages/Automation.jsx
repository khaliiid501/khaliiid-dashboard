import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Zap, 
  Plus, 
  FileText,
  Bell,
  Play,
  Pause,
  Edit3,
  Trash2,
  CheckCircle,
  Activity,
  TrendingUp,
  DollarSign,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

export default function Automation() {
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  const [ruleForm, setRuleForm] = useState({
    rule_name: '',
    rule_type: 'performance_based',
    trigger_condition: { metric: 'roi', threshold: 50 },
    action_type: 'increase_budget',
    action_params: { percentage: 10 },
    target_campaigns: []
  });

  const [templateForm, setTemplateForm] = useState({
    template_name: '',
    template_description: '',
    campaign_goal: 'awareness',
    target_audience: {},
    selected_platforms: [],
    default_budget: 0,
    duration_days: 30,
    auto_create: false,
    auto_create_frequency: 'monthly'
  });

  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['automationRules'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.AutomationRule.filter({ created_by: user.email });
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['campaignTemplates'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.CampaignTemplate.filter({ created_by: user.email });
    },
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Notification.filter({ created_by: user.email }, '-created_date');
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaignsForAutomation'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Campaign.filter({ created_by: user.email });
    },
  });

  const { data: platforms = [] } = useQuery({
    queryKey: ['platformsForAutomation'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.ConnectedPlatform.filter({ created_by: user.email });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automationRules']);
      setIsRuleDialogOpen(false);
      resetRuleForm();
      toast.success('تم إنشاء القاعدة بنجاح');
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutomationRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automationRules']);
      setIsRuleDialogOpen(false);
      resetRuleForm();
      toast.success('تم تحديث القاعدة');
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['automationRules']);
      toast.success('تم حذف القاعدة');
    }
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.AutomationRule.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries(['automationRules']);
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.CampaignTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaignTemplates']);
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
      toast.success('تم إنشاء القالب بنجاح');
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CampaignTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaignTemplates']);
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
      toast.success('تم تحديث القالب');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.CampaignTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['campaignTemplates']);
      toast.success('تم حذف القالب');
    }
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { 
      is_read: true,
      read_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const resetRuleForm = () => {
    setRuleForm({
      rule_name: '',
      rule_type: 'performance_based',
      trigger_condition: { metric: 'roi', threshold: 50 },
      action_type: 'increase_budget',
      action_params: { percentage: 10 },
      target_campaigns: []
    });
    setEditingRule(null);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      template_name: '',
      template_description: '',
      campaign_goal: 'awareness',
      target_audience: {},
      selected_platforms: [],
      default_budget: 0,
      duration_days: 30,
      auto_create: false,
      auto_create_frequency: 'monthly'
    });
    setEditingTemplate(null);
  };

  const handleRuleSubmit = () => {
    if (!ruleForm.rule_name.trim()) {
      toast.error('الرجاء إدخال اسم القاعدة');
      return;
    }

    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data: ruleForm });
    } else {
      createRuleMutation.mutate(ruleForm);
    }
  };

  const handleTemplateSubmit = () => {
    if (!templateForm.template_name.trim() || templateForm.selected_platforms.length === 0) {
      toast.error('الرجاء إكمال الحقول المطلوبة');
      return;
    }

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      medium: 'bg-blue-100 text-blue-700 border-blue-300',
      low: 'bg-slate-100 text-slate-700 border-slate-300'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">أتمتة الحملات</h1>
        <p className="text-slate-600">إدارة القواعد التلقائية والقوالب والإشعارات</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">القواعد النشطة</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {rules.filter(r => r.is_active).length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">القوالب المتاحة</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{templates.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">إشعارات غير مقروءة</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{unreadNotifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">القواعد التلقائية</TabsTrigger>
          <TabsTrigger value="templates">القوالب المتكررة</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
        </TabsList>

        {/* Automation Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              القواعد التلقائية تساعدك على تحسين أداء الحملات بناءً على معايير محددة
            </p>
            <Button onClick={() => { resetRuleForm(); setIsRuleDialogOpen(true); }}>
              <Plus className="w-4 h-4 ml-2" />
              قاعدة جديدة
            </Button>
          </div>

          <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRule ? 'تعديل القاعدة' : 'إنشاء قاعدة جديدة'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسم القاعدة *</label>
                  <Input
                    value={ruleForm.rule_name}
                    onChange={(e) => setRuleForm({ ...ruleForm, rule_name: e.target.value })}
                    placeholder="مثال: زيادة الميزانية للحملات الناجحة"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">نوع القاعدة</label>
                    <Select 
                      value={ruleForm.rule_type}
                      onValueChange={(value) => setRuleForm({ ...ruleForm, rule_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance_based">بناءً على الأداء</SelectItem>
                        <SelectItem value="budget_based">بناءً على الميزانية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">الإجراء</label>
                    <Select 
                      value={ruleForm.action_type}
                      onValueChange={(value) => setRuleForm({ ...ruleForm, action_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="increase_budget">زيادة الميزانية</SelectItem>
                        <SelectItem value="decrease_budget">تقليل الميزانية</SelectItem>
                        <SelectItem value="pause_campaign">إيقاف الحملة</SelectItem>
                        <SelectItem value="send_notification">إرسال إشعار</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {ruleForm.rule_type === 'performance_based' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">المقياس</label>
                      <Select 
                        value={ruleForm.trigger_condition.metric}
                        onValueChange={(value) => setRuleForm({
                          ...ruleForm,
                          trigger_condition: { ...ruleForm.trigger_condition, metric: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="roi">عائد الاستثمار (ROI)</SelectItem>
                          <SelectItem value="reach">الوصول</SelectItem>
                          <SelectItem value="engagement">التفاعل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">الحد الأدنى</label>
                      <Input
                        type="number"
                        value={ruleForm.trigger_condition.threshold}
                        onChange={(e) => setRuleForm({
                          ...ruleForm,
                          trigger_condition: { ...ruleForm.trigger_condition, threshold: parseFloat(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                )}

                {ruleForm.rule_type === 'budget_based' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">الشرط</label>
                      <Select 
                        value={ruleForm.trigger_condition.type || 'usage_above'}
                        onValueChange={(value) => setRuleForm({
                          ...ruleForm,
                          trigger_condition: { ...ruleForm.trigger_condition, type: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usage_above">الاستخدام أكبر من</SelectItem>
                          <SelectItem value="usage_below">الاستخدام أقل من</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">النسبة المئوية</label>
                      <Input
                        type="number"
                        value={ruleForm.trigger_condition.threshold || 80}
                        onChange={(e) => setRuleForm({
                          ...ruleForm,
                          trigger_condition: { ...ruleForm.trigger_condition, threshold: parseFloat(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                )}

                {(ruleForm.action_type === 'increase_budget' || ruleForm.action_type === 'decrease_budget') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">نسبة التغيير (%)</label>
                    <Input
                      type="number"
                      value={ruleForm.action_params.percentage}
                      onChange={(e) => setRuleForm({
                        ...ruleForm,
                        action_params: { ...ruleForm.action_params, percentage: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)} className="flex-1">
                    إلغاء
                  </Button>
                  <Button onClick={handleRuleSubmit} className="flex-1">
                    {editingRule ? 'حفظ' : 'إنشاء'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {rules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">لا توجد قواعد تلقائية</h3>
                <p className="text-slate-600 mb-6">ابدأ بإنشاء قاعدة لأتمتة إدارة حملاتك</p>
                <Button onClick={() => setIsRuleDialogOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء قاعدة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => (
                <Card key={rule.id} className={rule.is_active ? 'border-l-4 border-l-emerald-500' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{rule.rule_name}</h3>
                          {rule.is_active ? (
                            <Badge className="bg-emerald-100 text-emerald-700">نشطة</Badge>
                          ) : (
                            <Badge variant="secondary">متوقفة</Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-slate-600">
                          <p>النوع: {rule.rule_type === 'performance_based' ? 'بناءً على الأداء' : 'بناءً على الميزانية'}</p>
                          <p>الإجراء: {rule.action_type}</p>
                          {rule.execution_count > 0 && (
                            <p className="text-emerald-600">تم التنفيذ {rule.execution_count} مرة</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => toggleRuleMutation.mutate({ id: rule.id, is_active: checked })}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingRule(rule);
                            setRuleForm(rule);
                            setIsRuleDialogOpen(true);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذه القاعدة؟')) {
                              deleteRuleMutation.mutate(rule.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              القوالب تساعدك على إنشاء حملات متكررة تلقائياً
            </p>
            <Button onClick={() => { resetTemplateForm(); setIsTemplateDialogOpen(true); }}>
              <Plus className="w-4 h-4 ml-2" />
              قالب جديد
            </Button>
          </div>

          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسم القالب *</label>
                  <Input
                    value={templateForm.template_name}
                    onChange={(e) => setTemplateForm({ ...templateForm, template_name: e.target.value })}
                    placeholder="مثال: حملة شهرية للمنتجات"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الوصف</label>
                  <Textarea
                    value={templateForm.template_description}
                    onChange={(e) => setTemplateForm({ ...templateForm, template_description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">هدف الحملة</label>
                    <Select 
                      value={templateForm.campaign_goal}
                      onValueChange={(value) => setTemplateForm({ ...templateForm, campaign_goal: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="awareness">زيادة الوعي</SelectItem>
                        <SelectItem value="engagement">التفاعل</SelectItem>
                        <SelectItem value="conversions">التحويلات</SelectItem>
                        <SelectItem value="sales">المبيعات</SelectItem>
                        <SelectItem value="traffic">زيادة الزيارات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">الميزانية الافتراضية</label>
                    <Input
                      type="number"
                      value={templateForm.default_budget}
                      onChange={(e) => setTemplateForm({ ...templateForm, default_budget: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">المدة (أيام)</label>
                  <Input
                    type="number"
                    value={templateForm.duration_days}
                    onChange={(e) => setTemplateForm({ ...templateForm, duration_days: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">إنشاء تلقائي</label>
                    <Switch
                      checked={templateForm.auto_create}
                      onCheckedChange={(checked) => setTemplateForm({ ...templateForm, auto_create: checked })}
                    />
                  </div>

                  {templateForm.auto_create && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">التكرار</label>
                      <Select 
                        value={templateForm.auto_create_frequency}
                        onValueChange={(value) => setTemplateForm({ ...templateForm, auto_create_frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">يومي</SelectItem>
                          <SelectItem value="weekly">أسبوعي</SelectItem>
                          <SelectItem value="monthly">شهري</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)} className="flex-1">
                    إلغاء
                  </Button>
                  <Button onClick={handleTemplateSubmit} className="flex-1">
                    {editingTemplate ? 'حفظ' : 'إنشاء'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">لا توجد قوالب</h3>
                <p className="text-slate-600 mb-6">أنشئ قوالب لحملات متكررة</p>
                <Button onClick={() => setIsTemplateDialogOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء قالب
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className={template.auto_create ? 'border-l-4 border-l-blue-500' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{template.template_name}</h3>
                          {template.auto_create && (
                            <Badge className="bg-blue-100 text-blue-700">تلقائي</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-2">{template.template_description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>الهدف: {template.campaign_goal}</span>
                          <span>المدة: {template.duration_days} يوم</span>
                          <span>استخدم {template.usage_count || 0} مرة</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingTemplate(template);
                            setTemplateForm(template);
                            setIsTemplateDialogOpen(true);
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
                              deleteTemplateMutation.mutate(template.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">لا توجد إشعارات</h3>
                <p className="text-slate-600">ستظهر الإشعارات هنا عند وجود تحديثات</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`${!notification.is_read ? 'border-2' : ''} ${getPriorityColor(notification.priority)}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-white">
                        <Bell className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{notification.title}</h4>
                          {!notification.is_read && (
                            <Badge className="bg-blue-600 text-white">جديد</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-slate-700 mb-2">{notification.message}</p>
                        
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span>{new Date(notification.created_date).toLocaleDateString('ar-SA')}</span>
                          <Badge variant="outline">{notification.priority}</Badge>
                        </div>
                      </div>

                      {!notification.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markNotificationReadMutation.mutate(notification.id)}
                        >
                          <CheckCircle className="w-4 h-4 ml-1" />
                          تم
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}