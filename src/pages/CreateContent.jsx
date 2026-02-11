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
  Lightbulb
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
        prompt: `أنت خبير SEO متخصص في السوق السعودي. حلل المحتوى التالي واقترح تحسينات:

العنوان: ${editedTitle}
المحتوى: ${content}

قدم اقتراحات لتحسين SEO تشمل:
1. كلمات مفتاحية إضافية مناسبة للسعودية
2. نصائح لتحسين العنوان
3. اقتراحات لتحسين المحتوى
4. هاشتاقات مقترحة

أرجع JSON:
{
  "recommended_keywords": ["كلمة1", "كلمة2"],
  "title_suggestions": ["عنوان محسن 1", "عنوان محسن 2"],
  "content_improvements": ["اقتراح 1", "اقتراح 2"],
  "hashtags": ["#هاش1", "#هاش2"],
  "seo_score": 75
}`,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_keywords: { type: "array", items: { type: "string" } },
            title_suggestions: { type: "array", items: { type: "string" } },
            content_improvements: { type: "array", items: { type: "string" } },
            hashtags: { type: "array", items: { type: "string" } },
            seo_score: { type: "number" }
          }
        }
      });
      return result;
    },
    onSuccess: (data) => {
      setSeoSuggestions(data);
      toast.success('تم توليد اقتراحات SEO');
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">إنشاء محتوى جديد</h1>
        <p className="text-slate-600">ولّد محتوى إعلاني قوي باستخدام الذكاء الاصطناعي</p>
      </div>

      {/* Input Section */}
      <Card>
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
        <Card className="border-2 border-emerald-500">
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
                  اقتراحات SEO
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
                  {seoSuggestions.recommended_keywords?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">كلمات مفتاحية مقترحة:</p>
                      <div className="flex flex-wrap gap-2">
                        {seoSuggestions.recommended_keywords.map((kw, idx) => (
                          <Badge key={idx} variant="secondary" className="cursor-pointer hover:bg-slate-200">
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