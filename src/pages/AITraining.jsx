import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Brain, 
  Plus, 
  Trash2, 
  Sparkles,
  TrendingUp,
  FileText,
  Settings,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function AITraining() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    example_title: '',
    example_content: '',
    example_type: 'user_provided',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: preferences } = useQuery({
    queryKey: ['contentPreferences'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const prefs = await base44.entities.ContentPreferences.filter({ created_by: user.email });
      return prefs[0] || null;
    },
  });

  const { data: examples = [] } = useQuery({
    queryKey: ['trainingExamples'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.TrainingExample.filter({ created_by: user.email }, '-created_date');
    },
  });

  const { data: topContent = [] } = useQuery({
    queryKey: ['topPerformingContent'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const allContent = await base44.entities.Content.filter({ created_by: user.email });
      return allContent
        .filter(c => c.status === 'published' && c.performance_views > 0)
        .sort((a, b) => (b.performance_views + b.performance_engagement * 10) - (a.performance_views + a.performance_engagement * 10))
        .slice(0, 5);
    },
  });

  const createPreferencesMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentPreferences.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contentPreferences']);
      toast.success('تم حفظ التفضيلات بنجاح');
    }
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContentPreferences.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contentPreferences']);
      toast.success('تم تحديث التفضيلات');
    }
  });

  const createExampleMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingExample.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingExamples']);
      setIsDialogOpen(false);
      setFormData({
        example_title: '',
        example_content: '',
        example_type: 'user_provided',
        notes: ''
      });
      toast.success('تم إضافة المثال التدريبي');
    }
  });

  const deleteExampleMutation = useMutation({
    mutationFn: (id) => base44.entities.TrainingExample.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingExamples']);
      toast.success('تم حذف المثال');
    }
  });

  const toggleExampleMutation = useMutation({
    mutationFn: ({ id, isActive }) => 
      base44.entities.TrainingExample.update(id, { is_active: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingExamples']);
    }
  });

  const analyzeSuccessfulContentMutation = useMutation({
    mutationFn: async () => {
      if (topContent.length === 0) {
        throw new Error('لا يوجد محتوى ناجح لتحليله');
      }

      const contentSamples = topContent.map(c => c.content_text).join('\n\n---\n\n');
      
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت محلل محتوى خبير. حلل هذه العينات من المحتوى الإعلاني الناجح واستخرج:

1. اللهجة والأسلوب المستخدم
2. العبارات والكلمات الأكثر استخداماً
3. أسلوب الدعوة للإجراء (CTA)
4. الكلمات المفتاحية الشائعة
5. طول المحتوى المفضل

المحتوى الناجح:
${contentSamples}

أرجع النتيجة بتنسيق JSON:
{
  "dialect": "وصف اللهجة",
  "tone": "casual أو professional أو friendly أو enthusiastic أو formal",
  "preferred_phrases": ["عبارة1", "عبارة2"],
  "cta_style": "وصف أسلوب CTA",
  "successful_keywords": ["كلمة1", "كلمة2"],
  "content_length": "short أو medium أو long"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            dialect: { type: "string" },
            tone: { type: "string" },
            preferred_phrases: { type: "array", items: { type: "string" } },
            cta_style: { type: "string" },
            successful_keywords: { type: "array", items: { type: "string" } },
            content_length: { type: "string" }
          }
        }
      });

      const prefsData = {
        dialect_preference: analysis.dialect,
        tone: analysis.tone,
        preferred_phrases: analysis.preferred_phrases,
        cta_style: analysis.cta_style,
        successful_keywords: analysis.successful_keywords,
        content_length_preference: analysis.content_length,
        learned_patterns: JSON.stringify(analysis),
        last_updated: new Date().toISOString()
      };

      if (preferences) {
        await base44.entities.ContentPreferences.update(preferences.id, prefsData);
      } else {
        await base44.entities.ContentPreferences.create(prefsData);
      }

      return analysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contentPreferences']);
      toast.success('تم تحليل المحتوى وتحديث التفضيلات بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'حدث خطأ في التحليل');
    }
  });

  const addSuccessfulContentAsExample = async (content) => {
    await base44.entities.TrainingExample.create({
      example_title: content.title,
      example_content: content.content_text,
      example_type: 'successful_content',
      performance_score: content.performance_views + content.performance_engagement * 10,
      notes: `محتوى ناجح: ${content.performance_views} مشاهدة، ${content.performance_engagement}% تفاعل`
    });
    queryClient.invalidateQueries(['trainingExamples']);
    toast.success('تم إضافة المحتوى كمثال تدريبي');
  };

  const handleSubmitExample = () => {
    if (!formData.example_title.trim() || !formData.example_content.trim()) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }
    createExampleMutation.mutate(formData);
  };

  const handlePreferenceChange = (field, value) => {
    const data = { [field]: value, last_updated: new Date().toISOString() };
    if (preferences) {
      updatePreferencesMutation.mutate({ id: preferences.id, data });
    } else {
      createPreferencesMutation.mutate({ ...data, [field]: value });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">تدريب الذكاء الاصطناعي</h1>
        <p className="text-slate-600">علّم الذكاء الاصطناعي أسلوبك الخاص لإنتاج محتوى أفضل</p>
      </div>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences">
            <Settings className="w-4 h-4 ml-2" />
            التفضيلات
          </TabsTrigger>
          <TabsTrigger value="examples">
            <FileText className="w-4 h-4 ml-2" />
            أمثلة التدريب ({examples.length})
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <TrendingUp className="w-4 h-4 ml-2" />
            التحليل التلقائي
          </TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تفضيلات الأسلوب</CardTitle>
              <CardDescription>حدد أسلوبك المفضل في الكتابة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    نبرة الكتابة
                  </label>
                  <Select 
                    value={preferences?.tone || 'friendly'} 
                    onValueChange={(value) => handlePreferenceChange('tone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">غير رسمية</SelectItem>
                      <SelectItem value="professional">احترافية</SelectItem>
                      <SelectItem value="friendly">ودودة</SelectItem>
                      <SelectItem value="enthusiastic">حماسية</SelectItem>
                      <SelectItem value="formal">رسمية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    طول المحتوى المفضل
                  </label>
                  <Select 
                    value={preferences?.content_length_preference || 'medium'}
                    onValueChange={(value) => handlePreferenceChange('content_length_preference', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">قصير (100-150 كلمة)</SelectItem>
                      <SelectItem value="medium">متوسط (150-250 كلمة)</SelectItem>
                      <SelectItem value="long">طويل (250+ كلمة)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  أسلوب الدعوة للإجراء المفضل
                </label>
                <Input
                  placeholder='مثال: "اطلب الآن واحصل على خصم"'
                  value={preferences?.cta_style || ''}
                  onChange={(e) => handlePreferenceChange('cta_style', e.target.value)}
                />
              </div>

              {preferences?.learned_patterns && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">تم تعلم أسلوبك</p>
                      <p className="text-xs text-emerald-700 mt-1">
                        آخر تحديث: {new Date(preferences.last_updated).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600">
              أضف أمثلة على المحتوى الذي تريد من AI أن يحاكيه
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مثال
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>إضافة مثال تدريبي</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      عنوان المثال
                    </label>
                    <Input
                      value={formData.example_title}
                      onChange={(e) => setFormData({ ...formData, example_title: e.target.value })}
                      placeholder="مثال: محتوى ترويجي ناجح للعروض"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      نص المحتوى المثالي
                    </label>
                    <Textarea
                      value={formData.example_content}
                      onChange={(e) => setFormData({ ...formData, example_content: e.target.value })}
                      placeholder="اكتب المحتوى المثالي هنا..."
                      rows={8}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ملاحظات (اختياري)
                    </label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="أي ملاحظات حول هذا المثال..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleSubmitExample}
                      disabled={createExampleMutation.isPending}
                      className="flex-1"
                    >
                      إضافة المثال
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {examples.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">لا توجد أمثلة تدريبية</h3>
                <p className="text-slate-600 mb-6">ابدأ بإضافة أمثلة على المحتوى المثالي</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مثال جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {examples.map((example) => (
                <Card key={example.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-slate-900">{example.example_title}</h3>
                          <Badge variant={example.example_type === 'successful_content' ? 'default' : 'secondary'}>
                            {example.example_type === 'successful_content' ? 'محتوى ناجح' : 'مقدم من المستخدم'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-3 mb-3">
                          {example.example_content}
                        </p>
                        {example.notes && (
                          <p className="text-xs text-slate-500 italic">{example.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={example.is_active}
                          onCheckedChange={() => toggleExampleMutation.mutate({ 
                            id: example.id, 
                            isActive: example.is_active 
                          })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('هل تريد حذف هذا المثال؟')) {
                              deleteExampleMutation.mutate(example.id);
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التحليل التلقائي للمحتوى الناجح</CardTitle>
              <CardDescription>
                دع الذكاء الاصطناعي يحلل محتواك الناجح ويتعلم منه تلقائياً
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">كيف يعمل؟</p>
                    <p className="text-xs text-blue-700 mt-1">
                      سيقوم النظام بتحليل محتواك الذي حقق أفضل أداء واستخراج الأنماط والأساليب الناجحة
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => analyzeSuccessfulContentMutation.mutate()}
                disabled={analyzeSuccessfulContentMutation.isPending || topContent.length === 0}
                size="lg"
                className="w-full"
              >
                {analyzeSuccessfulContentMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 ml-2" />
                    تحليل المحتوى الناجح الآن
                  </>
                )}
              </Button>

              {topContent.length === 0 && (
                <p className="text-sm text-slate-600 text-center">
                  لا يوجد محتوى منشور بأداء جيد للتحليل حتى الآن
                </p>
              )}

              {topContent.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    أفضل محتوى ({topContent.length})
                  </h3>
                  <div className="space-y-3">
                    {topContent.map((content) => (
                      <Card key={content.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-900 mb-1">{content.title}</h4>
                              <p className="text-xs text-slate-600 mb-2">
                                {content.performance_views} مشاهدة • {content.performance_engagement}% تفاعل
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addSuccessfulContentAsExample(content)}
                            >
                              <Plus className="w-4 h-4 ml-1" />
                              إضافة كمثال
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}