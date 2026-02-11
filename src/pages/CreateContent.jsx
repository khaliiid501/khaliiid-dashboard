import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Link as LinkIcon, 
  Loader2,
  CheckCircle,
  TrendingUp,
  Edit3,
  Send,
  FileText,
  Brain,
  Eye,
  Lightbulb,
  Image as ImageIcon,
  Target
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import RichTextEditor from '../components/content/RichTextEditor';
import PlatformPreview from '../components/content/PlatformPreview';

export default function CreateContent() {
  const [activeTab, setActiveTab] = useState('idea');
  const [ideaInput, setIdeaInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedText, setEditedText] = useState('');
  const [seoSuggestions, setSeoSuggestions] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [contentIdeas, setContentIdeas] = useState([]);

  const queryClient = useQueryClient();

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const subs = await base44.entities.Subscription.filter({ user_email: user.email });
      return subs[0] || null;
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Template.filter({ created_by: user.email }, '-created_date');
    },
  });

  const { data: preferences } = useQuery({
    queryKey: ['contentPreferences'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const prefs = await base44.entities.ContentPreferences.filter({ created_by: user.email });
      return prefs[0] || null;
    },
  });

  const { data: trainingExamples = [] } = useQuery({
    queryKey: ['activeTrainingExamples'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const examples = await base44.entities.TrainingExample.filter({ 
        created_by: user.email,
        is_active: true 
      });
      return examples.slice(0, 3);
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['activeCampaignsForIdeas'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Campaign.filter({ 
        created_by: user.email,
        status: 'active'
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async ({ type, input, template }) => {
      const templateContext = template 
        ? `\n\nاستخدم هذا القالب كأساس للمحتوى:\n${template.template_content}\n\nوطوّره بناءً على الفكرة الجديدة.`
        : '';

      const userStyleContext = preferences ? `\n\nأسلوب المستخدم المفضل:
- النبرة: ${preferences.tone === 'casual' ? 'غير رسمية' : preferences.tone === 'professional' ? 'احترافية' : preferences.tone === 'friendly' ? 'ودودة' : preferences.tone === 'enthusiastic' ? 'حماسية' : 'رسمية'}
- طول المحتوى: ${preferences.content_length_preference === 'short' ? '100-150 كلمة' : preferences.content_length_preference === 'long' ? '250+ كلمة' : '150-250 كلمة'}
${preferences.cta_style ? `- أسلوب الدعوة للإجراء: ${preferences.cta_style}` : ''}
${preferences.preferred_phrases?.length > 0 ? `- عبارات مفضلة: ${preferences.preferred_phrases.join(', ')}` : ''}
${preferences.successful_keywords?.length > 0 ? `- كلمات مفتاحية ناجحة: ${preferences.successful_keywords.join(', ')}` : ''}` : '';

      const trainingExamplesContext = trainingExamples.length > 0 
        ? `\n\nأمثلة على أسلوب المستخدم المفضل:\n${trainingExamples.map((ex, i) => `${i + 1}. ${ex.example_title}:\n${ex.example_content}`).join('\n\n')}\n\nحاكي هذا الأسلوب في المحتوى الجديد.`
        : '';

      const prompt = type === 'idea' 
        ? `أنت خبير تسويق سعودي متخصص في كتابة محتوى إعلاني قوي باللهجة السعودية. 

المطلوب: اكتب محتوى إعلاني احترافي جذاب بناءً على الفكرة التالية: "${input}"${templateContext}${userStyleContext}${trainingExamplesContext}

المتطلبات:
1. استخدم اللهجة السعودية الطبيعية (مثل: وايد، كثير، زين، ممتاز، روعة، خيال)
2. اكتب بأسلوب مقنع وجذاب يحفز على الشراء أو التفاعل
3. ضمّن كلمات مفتاحية قوية لتحسين SEO في السعودية
4. اجعل المحتوى قصير ومركز (150-200 كلمة)
5. استخدم الترند الحالي في السعودية
6. اضف دعوة واضحة للإجراء (call to action)

أرجع النتيجة بتنسيق JSON:
{
  "title": "عنوان جذاب",
  "content": "نص المحتوى الإعلاني",
  "seo_keywords": "كلمة1, كلمة2, كلمة3",
  "trend_tags": ["ترند1", "ترند2"]
}`
        : `أنت خبير تسويق سعودي متخصص في كتابة محتوى إعلاني للمنتجات باللهجة السعودية.

المطلوب: حلل هذا الرابط واكتب محتوى إعلاني احترافي له: ${input}

المتطلبات:
1. استخرج معلومات المنتج من الرابط
2. استخدم اللهجة السعودية الطبيعية (مثل: وايد، كثير، زين، ممتاز، روعة)
3. اكتب بأسلوب مقنع يبرز فوائد المنتج
4. ضمّن كلمات مفتاحية قوية لتحسين SEO
5. اجعل المحتوى قصير ومركز (150-200 كلمة)
6. استخدم زوايا تسويقية مبتكرة
7. اضف دعوة واضحة للإجراء

أرجع النتيجة بتنسيق JSON:
{
  "title": "عنوان جذاب",
  "content": "نص المحتوى الإعلاني",
  "seo_keywords": "كلمة1, كلمة2, كلمة3",
  "trend_tags": ["ترند1", "ترند2"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: type === 'url',
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            seo_keywords: { type: "string" },
            trend_tags: { type: "array", items: { type: "string" } }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      setEditedTitle(data.title);
      setEditedText(data.content);
      toast.success('تم توليد المحتوى بنجاح!');
    },
    onError: () => {
      toast.error('حدث خطأ في توليد المحتوى');
    }
  });

  const generateSEOMutation = useMutation({
    mutationFn: async (content) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت خبير SEO متخصص في السوق السعودي. حلل المحتوى التالي واقترح تحسينات استراتيجية:

العنوان: ${editedTitle}
المحتوى: ${content}

قدم اقتراحات متقدمة لتحسين SEO تشمل:
1. كلمات مفتاحية استراتيجية عالية القيمة للسوق السعودي
2. تحليل كلمات المنافسين المحتملة
3. كلمات مفتاحية طويلة (Long-tail keywords)
4. نصائح لتحسين العنوان مع تحليل المنافسة
5. اقتراحات محددة لتحسين المحتوى
6. هاشتاقات عالية الأداء
7. توصيات لزيادة معدل التفاعل

أرجع JSON:
{
  "recommended_keywords": ["كلمة1", "كلمة2", "كلمة3"],
  "competitor_keywords": ["كلمة منافس 1", "كلمة منافس 2"],
  "longtail_keywords": ["كلمة طويلة 1", "كلمة طويلة 2"],
  "title_suggestions": ["عنوان محسن 1", "عنوان محسن 2"],
  "content_improvements": ["اقتراح 1", "اقتراح 2", "اقتراح 3"],
  "hashtags": ["#هاش1", "#هاش2", "#هاش3"],
  "engagement_tips": ["نصيحة 1", "نصيحة 2"],
  "seo_score": 75,
  "competitor_analysis": "تحليل موجز للمنافسة"
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_keywords: { type: "array", items: { type: "string" } },
            competitor_keywords: { type: "array", items: { type: "string" } },
            longtail_keywords: { type: "array", items: { type: "string" } },
            title_suggestions: { type: "array", items: { type: "string" } },
            content_improvements: { type: "array", items: { type: "string" } },
            hashtags: { type: "array", items: { type: "string" } },
            engagement_tips: { type: "array", items: { type: "string" } },
            seo_score: { type: "number" },
            competitor_analysis: { type: "string" }
          }
        }
      });
      return result;
    },
    onSuccess: (data) => {
      setSeoSuggestions(data);
      toast.success('تم توليد اقتراحات SEO المتقدمة');
    }
  });

  const generateImageMutation = useMutation({
    mutationFn: async (description) => {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `صورة إعلانية احترافية عالية الجودة: ${description}. التصميم يجب أن يكون جذاب، عصري، مناسب للسوق السعودي، مع ألوان جذابة وتكوين متوازن.`
      });
      return result;
    },
    onSuccess: (data) => {
      setGeneratedImage(data.url);
      toast.success('تم توليد الصورة بنجاح!');
    },
    onError: () => {
      toast.error('فشل في توليد الصورة');
    }
  });

  const generateIdeasMutation = useMutation({
    mutationFn: async () => {
      const campaignContext = campaigns.length > 0 
        ? `\n\nالحملات النشطة:\n${campaigns.map(c => `- ${c.campaign_name}: الهدف ${c.campaign_goal}, الجمهور المستهدف: ${JSON.stringify(c.target_audience || {})}`).join('\n')}`
        : '';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت خبير تسويق محتوى متخصص في السوق السعودي. ولّد أفكار محتوى إبداعية بناءً على:

1. الترندات الحالية في السعودية (استخدم بحث الإنترنت)
2. اهتمامات الجمهور في السوق السعودي${campaignContext}

المطلوب: ولّد 5 أفكار محتوى متنوعة ومبتكرة، كل فكرة يجب أن تكون:
- مرتبطة بترند حالي
- جذابة للجمهور السعودي
- قابلة للتنفيذ فوراً
- متنوعة (عروض، نصائح، قصص، تعليمية، ترفيهية)

أرجع JSON:
{
  "ideas": [
    {
      "title": "عنوان الفكرة",
      "description": "وصف موجز",
      "trend_connection": "الترند المرتبط",
      "target_audience": "الجمهور المستهدف",
      "suggested_platforms": ["instagram", "tiktok"]
    }
  ],
  "current_trends": ["ترند1", "ترند2", "ترند3"]
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  trend_connection: { type: "string" },
                  target_audience: { type: "string" },
                  suggested_platforms: { type: "array", items: { type: "string" } }
                }
              }
            },
            current_trends: { type: "array", items: { type: "string" } }
          }
        }
      });
      return result;
    },
    onSuccess: (data) => {
      setContentIdeas(data.ideas || []);
      toast.success(`تم توليد ${data.ideas?.length || 0} أفكار محتوى!`);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (status) => {
      const user = await base44.auth.me();
      
      // Strip HTML tags for plain text storage
      const tmp = document.createElement('div');
      tmp.innerHTML = editedText;
      const plainText = tmp.textContent || tmp.innerText || '';
      
      await base44.entities.Content.create({
        title: editedTitle,
        content_text: plainText,
        content_type: activeTab === 'idea' ? 'idea' : 'product_url',
        source_input: activeTab === 'idea' ? ideaInput : urlInput,
        seo_keywords: generatedContent.seo_keywords,
        trend_tags: generatedContent.trend_tags || [],
        status: status,
        target_platforms: []
      });

      // Update subscription usage
      if (subscription && subscription.content_quota > 0) {
        await base44.entities.Subscription.update(subscription.id, {
          content_used: (subscription.content_used || 0) + 1
        });
      }
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries(['subscription']);
      queryClient.invalidateQueries(['recentContent']);
      toast.success(status === 'draft' ? 'تم حفظ المسودة' : 'تم اعتماد المحتوى');
      
      // Reset form
      setGeneratedContent(null);
      setIdeaInput('');
      setUrlInput('');
      setIsEditing(false);
      setSeoSuggestions(null);
      setShowPreview(false);
    }
  });

  const handleGenerate = () => {
    const input = activeTab === 'idea' ? ideaInput : urlInput;
    if (!input.trim()) {
      toast.error('الرجاء إدخال ' + (activeTab === 'idea' ? 'فكرة' : 'رابط'));
      return;
    }

    // Check quota
    if (subscription && subscription.content_quota > 0) {
      if (subscription.content_used >= subscription.content_quota) {
        toast.error('لقد استنفدت حصتك الشهرية من المحتوى');
        return;
      }
    }

    const template = selectedTemplate ? templates.find(t => t.id === selectedTemplate) : null;
    
    // Update template usage count
    if (template) {
      base44.entities.Template.update(template.id, {
        usage_count: (template.usage_count || 0) + 1
      });
    }

    generateMutation.mutate({ type: activeTab, input, template });
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template && activeTab === 'idea') {
        setIdeaInput(template.template_content);
      }
    }
  };

  const canUseTrends = subscription && (subscription.has_trend_analysis || subscription.plan_type === 'premium');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-emerald-600 p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">إنشاء محتوى جديد</h1>
              <p className="text-white/80">حوّل أفكارك إلى محتوى احترافي في ثوانٍ</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Content Ideas */}
      <Card className="glass-card border-2 border-blue-200/50 hover-lift overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl" />
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              أفكار محتوى ذكية
            </CardTitle>
            <Button
              onClick={() => generateIdeasMutation.mutate()}
              disabled={generateIdeasMutation.isPending}
              variant="outline"
              size="sm"
            >
              {generateIdeasMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  ولّد أفكار جديدة
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contentIdeas.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">احصل على أفكار محتوى مبتكرة بناءً على الترندات الحالية</p>
              <Button
                onClick={() => generateIdeasMutation.mutate()}
                disabled={generateIdeasMutation.isPending}
                size="sm"
              >
                <Sparkles className="w-4 h-4 ml-2" />
                ابدأ التوليد
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {contentIdeas.map((idea, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-lg bg-white border hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    setIdeaInput(idea.description);
                    setActiveTab('idea');
                    toast.success('تم نسخ الفكرة');
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-slate-900">{idea.title}</h4>
                    <Target className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{idea.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">
                      <TrendingUp className="w-3 h-3 ml-1" />
                      {idea.trend_connection}
                    </Badge>
                    <Badge variant="outline">{idea.target_audience}</Badge>
                    {idea.suggested_platforms?.map((platform, i) => (
                      <Badge key={i} className="bg-blue-100 text-blue-700">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card className="glass-card border-slate-200/50 hover-lift">
        <CardHeader>
          <CardTitle>ما الذي تريد إنشاء محتوى عنه؟</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="idea" className="gap-2">
                <Sparkles className="w-4 h-4" />
                من فكرة
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-2">
                <LinkIcon className="w-4 h-4" />
                من رابط منتج
              </TabsTrigger>
            </TabsList>

            <TabsContent value="idea" className="space-y-4">
              {templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    استخدم قالب جاهز (اختياري)
                  </label>
                  <Select value={selectedTemplate || ''} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر قالباً أو ابدأ من الصفر">
                        {selectedTemplate ? (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {templates.find(t => t.id === selectedTemplate)?.template_name}
                          </div>
                        ) : (
                          'اختر قالباً أو ابدأ من الصفر'
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>بدون قالب</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {template.template_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    سيتم استخدام القالب كأساس وتطويره بناءً على فكرتك
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  اكتب فكرتك أو موضوعك
                </label>
                <Textarea
                  placeholder="مثال: عرض خاص على منتجات العناية بالبشرة للصيف"
                  value={ideaInput}
                  onChange={(e) => setIdeaInput(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {canUseTrends && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">اقتراحات الترند</p>
                      <p className="text-xs text-blue-700 mt-1">سيتم دمج الترندات الحالية في السعودية تلقائياً</p>
                    </div>
                  </div>
                </div>
              )}

              {(preferences || trainingExamples.length > 0) && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">AI مخصص لأسلوبك</p>
                      <p className="text-xs text-emerald-700 mt-1">
                        {preferences && `النبرة: ${preferences.tone === 'friendly' ? 'ودودة' : preferences.tone}`}
                        {trainingExamples.length > 0 && ` • ${trainingExamples.length} أمثلة تدريبية نشطة`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !ideaInput.trim()}
                className="w-full"
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 ml-2" />
                    ولّد محتوى ذكي
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  الصق رابط المنتج أو المتجر
                </label>
                <Input
                  placeholder="https://example.com/product"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  type="url"
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !urlInput.trim()}
                className="w-full"
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري التحليل والتوليد...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 ml-2" />
                    حلل وولّد محتوى
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedContent && (
        <Card className="glass-card border-2 border-emerald-400/50 shadow-xl animate-scale-in">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                المحتوى المولد
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="w-4 h-4 ml-2" />
                  {showPreview ? 'إخفاء المعاينة' : 'معاينة'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateSEOMutation.mutate(editedText)}
                  disabled={generateSEOMutation.isPending}
                >
                  {generateSEOMutation.isPending ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Lightbulb className="w-4 h-4 ml-2" />
                  )}
                  تحليل SEO
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateImageMutation.mutate(editedTitle + ' - ' + editedText.substring(0, 100))}
                  disabled={generateImageMutation.isPending}
                >
                  {generateImageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4 ml-2" />
                  )}
                  ولّد صورة
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit3 className="w-4 h-4 ml-2" />
                  {isEditing ? 'إلغاء التعديل' : 'تعديل'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">العنوان</label>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">المحتوى (محرر غني)</label>
                  <RichTextEditor
                    value={editedText}
                    onChange={setEditedText}
                    placeholder="اكتب محتواك هنا..."
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{editedTitle}</h3>
                  <div 
                    className="text-slate-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: editedText }}
                  />
                </div>
              </>
            )}

            {/* Generated Image */}
            {generatedImage && (
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-600" />
                    الصورة المولدة بواسطة AI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={generatedImage} 
                    alt="Generated content" 
                    className="w-full rounded-lg shadow-lg"
                  />
                  <p className="text-xs text-slate-500 mt-2">يمكنك حفظ الصورة واستخدامها مع المحتوى</p>
                </CardContent>
              </Card>
            )}

            {/* SEO Suggestions */}
            {seoSuggestions && (
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    اقتراحات تحسين SEO
                    {seoSuggestions.seo_score && (
                      <Badge className="bg-amber-600 text-white mr-auto">
                        نقاط SEO: {seoSuggestions.seo_score}/100
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {seoSuggestions.competitor_analysis && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-1">تحليل المنافسة:</p>
                      <p className="text-sm text-blue-700">{seoSuggestions.competitor_analysis}</p>
                    </div>
                  )}

                  {seoSuggestions.recommended_keywords?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">كلمات مفتاحية استراتيجية:</p>
                      <div className="flex flex-wrap gap-2">
                        {seoSuggestions.recommended_keywords.map((kw, idx) => (
                          <Badge key={idx} variant="secondary" className="cursor-pointer hover:bg-slate-200">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {seoSuggestions.competitor_keywords?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">كلمات المنافسين:</p>
                      <div className="flex flex-wrap gap-2">
                        {seoSuggestions.competitor_keywords.map((kw, idx) => (
                          <Badge key={idx} className="bg-orange-100 text-orange-700">
                            <Target className="w-3 h-3 ml-1" />
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {seoSuggestions.longtail_keywords?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">كلمات مفتاحية طويلة:</p>
                      <div className="flex flex-wrap gap-2">
                        {seoSuggestions.longtail_keywords.map((kw, idx) => (
                          <Badge key={idx} className="bg-green-100 text-green-700">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {seoSuggestions.title_suggestions?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">عناوين محسنة مقترحة:</p>
                      <div className="space-y-2">
                        {seoSuggestions.title_suggestions.map((title, idx) => (
                          <div 
                            key={idx}
                            className="p-2 bg-white rounded border text-sm cursor-pointer hover:border-amber-400"
                            onClick={() => setEditedTitle(title)}
                          >
                            {title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {seoSuggestions.content_improvements?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">نصائح التحسين:</p>
                      <ul className="space-y-1 text-sm text-slate-600">
                        {seoSuggestions.content_improvements.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-600">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {seoSuggestions.hashtags?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">هاشتاقات مقترحة:</p>
                      <div className="flex flex-wrap gap-2">
                        {seoSuggestions.hashtags.map((tag, idx) => (
                          <Badge key={idx} className="bg-blue-100 text-blue-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {seoSuggestions.engagement_tips?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">نصائح لزيادة التفاعل:</p>
                      <ul className="space-y-1 text-sm text-slate-600">
                        {seoSuggestions.engagement_tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-600">✓</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Platform Preview */}
            {showPreview && (
              <PlatformPreview 
                title={editedTitle} 
                content={editedText}
              />
            )}

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">الكلمات المفتاحية (SEO):</p>
              <div className="flex flex-wrap gap-2">
                {generatedContent.seo_keywords?.split(',').map((keyword, idx) => (
                  <Badge key={idx} variant="secondary">{keyword.trim()}</Badge>
                ))}
              </div>
            </div>

            {generatedContent.trend_tags && generatedContent.trend_tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">تاجات الترند:</p>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.trend_tags.map((tag, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                      <TrendingUp className="w-3 h-3 ml-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <div className="flex gap-3">
                <Button
                  onClick={() => saveMutation.mutate('draft')}
                  variant="outline"
                  disabled={saveMutation.isPending}
                  className="flex-1"
                >
                  حفظ كمسودة
                </Button>
                <Button
                  onClick={() => saveMutation.mutate('approved')}
                  disabled={saveMutation.isPending}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 ml-2" />
                  اعتماد المحتوى
                </Button>
              </div>
              <Button
                onClick={async () => {
                  await base44.entities.Template.create({
                    template_name: editedTitle,
                    template_content: editedText,
                    category: 'general',
                    seo_keywords: generatedContent.seo_keywords,
                    trend_tags: generatedContent.trend_tags || []
                  });
                  queryClient.invalidateQueries(['templates']);
                  toast.success('تم حفظ المحتوى كقالب جديد');
                }}
                variant="outline"
                className="w-full"
              >
                <FileText className="w-4 h-4 ml-2" />
                حفظ كقالب جديد
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}