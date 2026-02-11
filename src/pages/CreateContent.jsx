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
  Target,
  Plus,
  Trash2,
  RefreshCw,
  BarChart3,
  Users,
  Award,
  AlertCircle
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
  const [contentVariations, setContentVariations] = useState([]);
  const [showVariations, setShowVariations] = useState(false);
  const [competitorInsights, setCompetitorInsights] = useState(null);
  const [showCompetitorSection, setShowCompetitorSection] = useState(false);
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [competitorPlatform, setCompetitorPlatform] = useState('website');
  const [competitorAnalysis, setCompetitorAnalysis] = useState(null);
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);

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

  const { data: competitors = [] } = useQuery({
    queryKey: ['competitors'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Competitor.filter({ created_by: user.email }, '-last_analyzed');
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

  const generateAdvancedIdeasMutation = useMutation({
    mutationFn: async () => {
      const campaignContext = campaigns.length > 0 
        ? `\n\nالحملات النشطة:\n${campaigns.map(c => `- ${c.campaign_name}: الهدف ${c.campaign_goal}, الجمهور المستهدف: ${JSON.stringify(c.target_audience || {})}`).join('\n')}`
        : '';

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت خبير تسويق محتوى ومحلل منافسين متخصص في السوق السعودي والعالمي. ولّد أفكار محتوى متقدمة ومبتكرة بناءً على:

1. الترندات العالمية والمحلية الحالية (استخدم بحث الإنترنت)
2. تحليل استراتيجيات المنافسين الناجحة في السوق السعودي
3. أفضل الممارسات العالمية في التسويق بالمحتوى${campaignContext}

المطلوب: ولّد 6 أفكار محتوى متقدمة ومتنوعة، كل فكرة يجب أن تشمل:
- عنوان جذاب ومبتكر
- وصف تفصيلي للفكرة
- الترند العالمي/المحلي المرتبط
- تحليل المنافسين: ماذا يفعلون؟ كيف نتفوق عليهم؟
- الجمهور المستهدف بدقة
- المنصات المثالية للنشر
- نصيحة استراتيجية للتنفيذ
- درجة صعوبة التنفيذ (سهلة/متوسطة/صعبة)
- العائد المتوقع (منخفض/متوسط/عالي)

أرجع JSON:
{
  "ideas": [
    {
      "title": "عنوان الفكرة",
      "description": "وصف تفصيلي",
      "trend_connection": "الترند المرتبط (عالمي أو محلي)",
      "competitor_analysis": "تحليل المنافسين وكيفية التفوق",
      "target_audience": "الجمهور المستهدف",
      "suggested_platforms": ["instagram", "tiktok"],
      "strategic_tip": "نصيحة استراتيجية",
      "difficulty": "سهلة",
      "expected_roi": "عالي"
    }
  ],
  "global_trends": ["ترند عالمي 1", "ترند عالمي 2"],
  "local_trends": ["ترند محلي 1", "ترند محلي 2"],
  "competitor_insights": {
    "top_strategies": ["استراتيجية 1", "استراتيجية 2"],
    "content_gaps": ["فرصة غير مستغلة 1", "فرصة غير مستغلة 2"],
    "best_performing_formats": ["فيديو قصير", "carousel", "story"]
  }
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
      setCompetitorInsights(data.competitor_insights || null);
      toast.success(`تم توليد ${data.ideas?.length || 0} أفكار متقدمة مع تحليل المنافسين!`);
    }
  });

  const generateVariationsMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت خبير كتابة محتوى متعدد الأساليب. لديك المحتوى التالي:

العنوان: ${editedTitle}
المحتوى: ${editedText}

المطلوب: أنشئ 5 صيغ مختلفة من هذا المحتوى:

1. **منشور قصير** (50-75 كلمة): مثالي لتويتر/تغريدة، مركّز، لافت للانتباه
2. **منشور متوسط** (150-200 كلمة): مثالي لإنستغرام/فيسبوك، متوازن، جذاب
3. **منشور طويل** (300-400 كلمة): مثالي لينكد إن/مقال، شامل، احترافي
4. **نص إعلاني** (75-100 كلمة): مقنع، يحفز على الشراء، واضح ال CTA
5. **قصة story** (30-40 كلمة): سريع، ملهم، يشجع على التفاعل الفوري

كل صيغة يجب أن:
- تحافظ على الرسالة الأساسية
- تناسب المنصة والطول المحدد
- تستخدم أسلوب مختلف مناسب للغرض

أرجع JSON:
{
  "variations": [
    {
      "type": "short",
      "label": "منشور قصير",
      "platform": "Twitter / X",
      "title": "عنوان محسّن",
      "content": "النص الكامل",
      "word_count": 65,
      "best_for": "الوصول السريع والتفاعل الفوري"
    },
    {
      "type": "medium",
      "label": "منشور متوسط",
      "platform": "Instagram / Facebook",
      "title": "عنوان محسّن",
      "content": "النص الكامل",
      "word_count": 180,
      "best_for": "التفاعل والمشاركة"
    },
    {
      "type": "long",
      "label": "منشور طويل",
      "platform": "LinkedIn / مقال",
      "title": "عنوان محسّن",
      "content": "النص الكامل",
      "word_count": 350,
      "best_for": "بناء سلطة وثقة"
    },
    {
      "type": "ad",
      "label": "نص إعلاني",
      "platform": "إعلانات مدفوعة",
      "title": "عنوان محسّن",
      "content": "النص الكامل",
      "word_count": 85,
      "best_for": "التحويلات والمبيعات"
    },
    {
      "type": "story",
      "label": "قصة Story",
      "platform": "Instagram / Snapchat Stories",
      "title": "عنوان محسّن",
      "content": "النص الكامل",
      "word_count": 35,
      "best_for": "التفاعل السريع والعاطفي"
    }
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            variations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  label: { type: "string" },
                  platform: { type: "string" },
                  title: { type: "string" },
                  content: { type: "string" },
                  word_count: { type: "number" },
                  best_for: { type: "string" }
                }
              }
            }
          }
        }
      });
      return result;
    },
    onSuccess: (data) => {
      setContentVariations(data.variations || []);
      setShowVariations(true);
      toast.success('تم توليد 5 صيغ مختلفة من المحتوى!');
    }
  });

  const rephraseMutation = useMutation({
    mutationFn: async (style) => {
      const styles = {
        professional: 'احترافي جداً، رسمي، لغة عمل',
        friendly: 'ودود، دافئ، قريب من القلب',
        enthusiastic: 'حماسي، متحمس، مليء بالطاقة',
        educational: 'تعليمي، إرشادي، واضح ومفصّل',
        storytelling: 'قصصي، سردي، يحكي تجربة'
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت خبير إعادة صياغة محتوى. لديك المحتوى التالي:

العنوان: ${editedTitle}
المحتوى: ${editedText}

المطلوب: أعد صياغة هذا المحتوى بأسلوب **${styles[style]}**

الشروط:
- احتفظ بجميع المعلومات والرسالة الأساسية
- غيّر الأسلوب واللغة والتعابير بالكامل
- اجعله يتماشى تماماً مع الأسلوب المطلوب
- نفس الطول تقريباً
- استخدم اللهجة السعودية الطبيعية

أرجع JSON:
{
  "title": "العنوان المعاد صياغته",
  "content": "المحتوى المعاد صياغته",
  "style_description": "وصف موجز للأسلوب المطبق"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            style_description: { type: "string" }
          }
        }
      });
      return result;
    },
    onSuccess: (data) => {
      setEditedTitle(data.title);
      setEditedText(data.content);
      toast.success('تم إعادة صياغة المحتوى بنجاح!');
    }
  });

  const analyzeCompetitorMutation = useMutation({
    mutationFn: async ({ url, platform, name }) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت محلل منافسين خبير في التسويق الرقمي. حلل المنافس التالي:

الرابط: ${url}
المنصة: ${platform}
الاسم: ${name || 'غير محدد'}

المطلوب: قم بتحليل شامل ومتقدم يشمل:

1. **استراتيجيات المحتوى**: ما هي الأنماط والاستراتيجيات المستخدمة؟
2. **نقاط القوة**: ما الذي يفعلونه بشكل ممتاز؟
3. **نقاط الضعف والفرص**: أين يمكننا التفوق عليهم؟
4. **معدل التفاعل المقدر**: نسبة تقريبية بناءً على المحتوى المتاح
5. **تكرار النشر**: كم مرة ينشرون محتوى؟
6. **أنواع المحتوى الأكثر نجاحاً**: ما الصيغ التي تحقق أفضل أداء؟
7. **الجمهور المستهدف**: من يستهدفون؟
8. **الكلمات المفتاحية الرئيسية**: ما هي الكلمات والمصطلحات المتكررة؟
9. **أسلوب الكتابة والنبرة**: كيف يتواصلون مع جمهورهم؟
10. **أوقات النشر المفضلة**: متى ينشرون عادةً؟

أرجع JSON:
{
  "content_strategies": ["استراتيجية 1", "استراتيجية 2", "استراتيجية 3"],
  "strengths": ["قوة 1", "قوة 2", "قوة 3"],
  "weaknesses": ["ضعف 1", "ضعف 2", "ضعف 3"],
  "estimated_engagement_rate": 4.5,
  "posting_frequency": "3-4 مرات أسبوعياً",
  "top_content_types": ["نوع 1", "نوع 2", "نوع 3"],
  "target_audience": "وصف الجمهور المستهدف",
  "primary_keywords": ["كلمة 1", "كلمة 2", "كلمة 3"],
  "writing_style": "وصف الأسلوب والنبرة",
  "best_posting_times": "الأوقات المفضلة",
  "unique_selling_points": ["نقطة بيع 1", "نقطة بيع 2"],
  "recommended_counter_strategies": ["استراتيجية للتفوق 1", "استراتيجية للتفوق 2", "استراتيجية للتفوق 3"]
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            content_strategies: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            estimated_engagement_rate: { type: "number" },
            posting_frequency: { type: "string" },
            top_content_types: { type: "array", items: { type: "string" } },
            target_audience: { type: "string" },
            primary_keywords: { type: "array", items: { type: "string" } },
            writing_style: { type: "string" },
            best_posting_times: { type: "string" },
            unique_selling_points: { type: "array", items: { type: "string" } },
            recommended_counter_strategies: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Save competitor to database
      const competitorData = {
        competitor_name: name || url,
        competitor_url: url,
        platform: platform,
        analysis_data: result,
        content_strategies: result.content_strategies || [],
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        estimated_engagement_rate: result.estimated_engagement_rate || 0,
        posting_frequency: result.posting_frequency || '',
        last_analyzed: new Date().toISOString()
      };

      await base44.entities.Competitor.create(competitorData);
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['competitors']);
      setCompetitorAnalysis(data);
      setCompetitorUrl('');
      toast.success('تم تحليل المنافس وحفظ البيانات بنجاح!');
    }
  });

  const generateCompetitorComparisonMutation = useMutation({
    mutationFn: async () => {
      if (selectedCompetitors.length === 0) {
        throw new Error('الرجاء اختيار منافس واحد على الأقل');
      }

      const competitorsData = competitors.filter(c => selectedCompetitors.includes(c.id));
      const userCampaignsData = campaigns.slice(0, 5);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت محلل تسويق استراتيجي خبير. قم بإجراء مقارنة تنافسية شاملة:

**بيانات حملات المستخدم:**
${userCampaignsData.map(c => `- ${c.campaign_name}: ROI ${c.roi || 0}%, الوصول ${c.total_reach || 0}, التفاعل ${c.total_engagement || 0}, التحويلات ${c.total_conversions || 0}`).join('\n')}

**بيانات المنافسين:**
${competitorsData.map(c => `- ${c.competitor_name} (${c.platform}):
  معدل التفاعل: ${c.estimated_engagement_rate || 0}%
  استراتيجيات: ${c.content_strategies?.join(', ') || 'غير محدد'}
  نقاط القوة: ${c.strengths?.join(', ') || 'غير محدد'}
  نقاط الضعف: ${c.weaknesses?.join(', ') || 'غير محدد'}`).join('\n\n')}

المطلوب: تحليل مقارن متقدم يشمل:

1. **تحليل الفجوة التنافسية**: أين يتفوق المنافسون؟ أين نحن أفضل؟
2. **فرص التحسين الفورية**: 5 إجراءات ملموسة للتحسين
3. **استراتيجيات التفوق**: كيف نتجاوز المنافسين في كل جانب؟
4. **توصيات المحتوى**: أنواع المحتوى التي يجب التركيز عليها
5. **توقعات الأداء**: إذا طبقنا التوصيات، ما العائد المتوقع؟
6. **خطة عمل 30 يوم**: خطوات عملية واضحة

أرجع JSON:
{
  "competitive_gap_analysis": {
    "where_they_excel": ["مجال 1", "مجال 2"],
    "where_we_excel": ["مجال 1", "مجال 2"],
    "critical_gaps": ["فجوة 1", "فجوة 2"]
  },
  "immediate_improvements": [
    {
      "action": "الإجراء",
      "impact": "عالي/متوسط/منخفض",
      "effort": "سهل/متوسط/صعب",
      "expected_result": "النتيجة المتوقعة"
    }
  ],
  "dominance_strategies": [
    {
      "strategy": "الاستراتيجية",
      "how_to_implement": "كيفية التطبيق",
      "timeline": "الإطار الزمني",
      "expected_roi_increase": "نسبة الزيادة المتوقعة في ROI"
    }
  ],
  "content_recommendations": {
    "focus_content_types": ["نوع 1", "نوع 2"],
    "avoid_content_types": ["نوع 1", "نوع 2"],
    "optimal_posting_schedule": "الجدول المثالي"
  },
  "performance_forecast": {
    "engagement_increase": "نسبة الزيادة المتوقعة",
    "reach_increase": "نسبة الزيادة المتوقعة",
    "conversion_increase": "نسبة الزيادة المتوقعة"
  },
  "action_plan_30_days": [
    {
      "week": 1,
      "actions": ["إجراء 1", "إجراء 2"],
      "goal": "الهدف"
    }
  ],
  "overall_score": {
    "user_score": 75,
    "competitor_avg_score": 80,
    "gap": -5
  }
}`,
        response_json_schema: {
          type: "object",
          properties: {
            competitive_gap_analysis: {
              type: "object",
              properties: {
                where_they_excel: { type: "array", items: { type: "string" } },
                where_we_excel: { type: "array", items: { type: "string" } },
                critical_gaps: { type: "array", items: { type: "string" } }
              }
            },
            immediate_improvements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  impact: { type: "string" },
                  effort: { type: "string" },
                  expected_result: { type: "string" }
                }
              }
            },
            dominance_strategies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  strategy: { type: "string" },
                  how_to_implement: { type: "string" },
                  timeline: { type: "string" },
                  expected_roi_increase: { type: "string" }
                }
              }
            },
            content_recommendations: {
              type: "object",
              properties: {
                focus_content_types: { type: "array", items: { type: "string" } },
                avoid_content_types: { type: "array", items: { type: "string" } },
                optimal_posting_schedule: { type: "string" }
              }
            },
            performance_forecast: {
              type: "object",
              properties: {
                engagement_increase: { type: "string" },
                reach_increase: { type: "string" },
                conversion_increase: { type: "string" }
              }
            },
            action_plan_30_days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  week: { type: "number" },
                  actions: { type: "array", items: { type: "string" } },
                  goal: { type: "string" }
                }
              }
            },
            overall_score: {
              type: "object",
              properties: {
                user_score: { type: "number" },
                competitor_avg_score: { type: "number" },
                gap: { type: "number" }
              }
            }
          }
        }
      });
      
      return result;
    },
    onSuccess: (data) => {
      setCompetitorAnalysis(data);
      toast.success('تم توليد تحليل تنافسي متقدم!');
    }
  });

  const addCompetitorMutation = useMutation({
    mutationFn: async () => {
      if (!competitorUrl.trim()) {
        throw new Error('الرجاء إدخال رابط المنافس');
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `حلل المنافس التالي بشكل سريع:
الرابط: ${competitorUrl}
المنصة: ${competitorPlatform}

استخرج:
- اسم المنافس/العلامة التجارية
- المجال/الصناعة
- 3 استراتيجيات محتوى رئيسية
- 3 نقاط قوة
- 3 نقاط ضعف/فرص
- معدل التفاعل المقدر (رقم من 0-100)
- تكرار النشر

أرجع JSON:
{
  "name": "اسم المنافس",
  "industry": "المجال",
  "content_strategies": ["استراتيجية 1", "استراتيجية 2", "استراتيجية 3"],
  "strengths": ["قوة 1", "قوة 2", "قوة 3"],
  "weaknesses": ["ضعف 1", "ضعف 2", "ضعف 3"],
  "estimated_engagement_rate": 4.5,
  "posting_frequency": "3-4 مرات أسبوعياً"
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            industry: { type: "string" },
            content_strategies: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            estimated_engagement_rate: { type: "number" },
            posting_frequency: { type: "string" }
          }
        }
      });

      await base44.entities.Competitor.create({
        competitor_name: result.name,
        competitor_url: competitorUrl,
        platform: competitorPlatform,
        industry: result.industry || '',
        analysis_data: result,
        content_strategies: result.content_strategies || [],
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        estimated_engagement_rate: result.estimated_engagement_rate || 0,
        posting_frequency: result.posting_frequency || '',
        last_analyzed: new Date().toISOString()
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['competitors']);
      setCompetitorUrl('');
      toast.success('تم إضافة المنافس وتحليله بنجاح!');
    }
  });

  const deleteCompetitorMutation = useMutation({
    mutationFn: (id) => base44.entities.Competitor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['competitors']);
      toast.success('تم حذف المنافس');
    }
  });

  const reanalyzeCompetitorMutation = useMutation({
    mutationFn: async (competitor) => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `حدّث تحليل المنافس التالي:
الاسم: ${competitor.competitor_name}
الرابط: ${competitor.competitor_url}
المنصة: ${competitor.platform}

المطلوب: تحليل محدّث يشمل أحدث البيانات والتغييرات

أرجع JSON بنفس تنسيق التحليل الأصلي`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            industry: { type: "string" },
            content_strategies: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            estimated_engagement_rate: { type: "number" },
            posting_frequency: { type: "string" }
          }
        }
      });

      await base44.entities.Competitor.update(competitor.id, {
        analysis_data: result,
        content_strategies: result.content_strategies || [],
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        estimated_engagement_rate: result.estimated_engagement_rate || 0,
        posting_frequency: result.posting_frequency || '',
        last_analyzed: new Date().toISOString()
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['competitors']);
      toast.success('تم تحديث تحليل المنافس!');
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

      {/* Competitor Analysis Section */}
      <Card className="glass-card border-2 border-purple-200/50 hover-lift overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              تحليل المنافسين المتقدم
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompetitorSection(!showCompetitorSection)}
            >
              {showCompetitorSection ? 'إخفاء' : 'عرض'}
            </Button>
          </div>
        </CardHeader>

        {showCompetitorSection && (
          <CardContent className="space-y-4">
            {/* Add Competitor Form */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3">إضافة منافس جديد</h4>
              <div className="flex gap-3">
                <Input
                  placeholder="أدخل رابط المنافس (موقع، حساب انستقرام، إلخ)"
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  className="flex-1"
                />
                <Select value={competitorPlatform} onValueChange={setCompetitorPlatform}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">موقع</SelectItem>
                    <SelectItem value="instagram">انستقرام</SelectItem>
                    <SelectItem value="twitter">تويتر</SelectItem>
                    <SelectItem value="tiktok">تيك توك</SelectItem>
                    <SelectItem value="linkedin">لينكد إن</SelectItem>
                    <SelectItem value="facebook">فيسبوك</SelectItem>
                    <SelectItem value="youtube">يوتيوب</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => addCompetitorMutation.mutate()}
                  disabled={addCompetitorMutation.isPending}
                  className="bg-gradient-to-l from-purple-600 to-blue-600"
                >
                  {addCompetitorMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 ml-2" />
                      تحليل
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Competitors List */}
            {competitors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">المنافسون المحفوظون ({competitors.length})</h4>
                  {competitors.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (selectedCompetitors.length === 0) {
                          toast.error('اختر منافس واحد على الأقل للمقارنة');
                          return;
                        }
                        generateCompetitorComparisonMutation.mutate();
                      }}
                      disabled={generateCompetitorComparisonMutation.isPending}
                    >
                      {generateCompetitorComparisonMutation.isPending ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <BarChart3 className="w-4 h-4 ml-2" />
                      )}
                      مقارنة شاملة
                    </Button>
                  )}
                </div>

                <div className="grid gap-3">
                  {competitors.map((comp) => (
                    <div 
                      key={comp.id}
                      className={`p-4 rounded-xl border transition-all ${
                        selectedCompetitors.includes(comp.id)
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-slate-200 bg-white hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCompetitors.includes(comp.id)}
                          onChange={() => {
                            setSelectedCompetitors(prev =>
                              prev.includes(comp.id)
                                ? prev.filter(id => id !== comp.id)
                                : [...prev, comp.id]
                            );
                          }}
                          className="mt-1 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-bold text-slate-900">{comp.competitor_name}</h5>
                              <p className="text-xs text-slate-600">{comp.platform} • {comp.industry}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => reanalyzeCompetitorMutation.mutate(comp)}
                                disabled={reanalyzeCompetitorMutation.isPending}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteCompetitorMutation.mutate(comp.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="font-semibold text-emerald-900 mb-1">نقاط القوة:</p>
                              <ul className="space-y-0.5 text-slate-700">
                                {comp.strengths?.slice(0, 2).map((s, i) => (
                                  <li key={i}>• {s}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="font-semibold text-amber-900 mb-1">فرص للتفوق:</p>
                              <ul className="space-y-0.5 text-slate-700">
                                {comp.weaknesses?.slice(0, 2).map((w, i) => (
                                  <li key={i}>• {w}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="flex gap-3 mt-3 text-xs">
                            <Badge variant="outline">
                              معدل التفاعل: {comp.estimated_engagement_rate || 0}%
                            </Badge>
                            <Badge variant="outline">
                              {comp.posting_frequency || 'غير محدد'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competitive Comparison Results */}
            {competitorAnalysis && (
              <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-slate-900 to-purple-900 text-white">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Award className="w-6 h-6 text-amber-400" />
                  التحليل التنافسي الشامل
                </h3>

                {/* Overall Score */}
                {competitorAnalysis.overall_score && (
                  <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <div className="text-center">
                      <p className="text-xs text-white/70 mb-1">نقاطك</p>
                      <p className="text-3xl font-bold text-emerald-400">
                        {competitorAnalysis.overall_score.user_score}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/70 mb-1">متوسط المنافسين</p>
                      <p className="text-3xl font-bold text-blue-400">
                        {competitorAnalysis.overall_score.competitor_avg_score}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/70 mb-1">الفجوة</p>
                      <p className={`text-3xl font-bold ${
                        competitorAnalysis.overall_score.gap >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {competitorAnalysis.overall_score.gap > 0 ? '+' : ''}{competitorAnalysis.overall_score.gap}
                      </p>
                    </div>
                  </div>
                )}

                {/* Gap Analysis */}
                {competitorAnalysis.competitive_gap_analysis && (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/30">
                      <h5 className="font-bold mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        نتفوق هنا
                      </h5>
                      <ul className="space-y-1 text-sm">
                        {competitorAnalysis.competitive_gap_analysis.where_we_excel?.map((item, i) => (
                          <li key={i}>✓ {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/20 border border-red-400/30">
                      <h5 className="font-bold mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        يتفوقون هنا
                      </h5>
                      <ul className="space-y-1 text-sm">
                        {competitorAnalysis.competitive_gap_analysis.where_they_excel?.map((item, i) => (
                          <li key={i}>⚠ {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-400/30">
                      <h5 className="font-bold mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        فجوات حرجة
                      </h5>
                      <ul className="space-y-1 text-sm">
                        {competitorAnalysis.competitive_gap_analysis.critical_gaps?.map((item, i) => (
                          <li key={i}>→ {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Immediate Improvements */}
                {competitorAnalysis.immediate_improvements && (
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <h5 className="font-bold mb-3 text-lg">⚡ إجراءات فورية للتحسين</h5>
                    <div className="grid gap-3">
                      {competitorAnalysis.immediate_improvements.map((improvement, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-white/10 border border-white/20">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="font-semibold">{improvement.action}</p>
                            <div className="flex gap-2">
                              <Badge className={
                                improvement.impact === 'عالي' ? 'bg-red-500' :
                                improvement.impact === 'متوسط' ? 'bg-amber-500' :
                                'bg-slate-500'
                              }>
                                تأثير: {improvement.impact}
                              </Badge>
                              <Badge className={
                                improvement.effort === 'سهل' ? 'bg-emerald-500' :
                                improvement.effort === 'متوسط' ? 'bg-blue-500' :
                                'bg-purple-500'
                              }>
                                جهد: {improvement.effort}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-white/80">النتيجة: {improvement.expected_result}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dominance Strategies */}
                {competitorAnalysis.dominance_strategies && (
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <h5 className="font-bold mb-3 text-lg">🎯 استراتيجيات التفوق</h5>
                    <div className="space-y-3">
                      {competitorAnalysis.dominance_strategies.map((strategy, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-white/10 border border-white/20">
                          <h6 className="font-bold mb-2">{idx + 1}. {strategy.strategy}</h6>
                          <p className="text-sm mb-2 text-white/90">{strategy.how_to_implement}</p>
                          <div className="flex gap-3 text-xs">
                            <Badge variant="outline" className="text-white border-white/30">
                              ⏱ {strategy.timeline}
                            </Badge>
                            <Badge className="bg-emerald-600">
                              📈 ROI +{strategy.expected_roi_increase}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Recommendations */}
                {competitorAnalysis.content_recommendations && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/30">
                      <h5 className="font-bold mb-2">✅ ركّز على:</h5>
                      <ul className="space-y-1 text-sm">
                        {competitorAnalysis.content_recommendations.focus_content_types?.map((type, i) => (
                          <li key={i}>• {type}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/20 border border-red-400/30">
                      <h5 className="font-bold mb-2">⛔ تجنب:</h5>
                      <ul className="space-y-1 text-sm">
                        {competitorAnalysis.content_recommendations.avoid_content_types?.map((type, i) => (
                          <li key={i}>• {type}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Performance Forecast */}
                {competitorAnalysis.performance_forecast && (
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <h5 className="font-bold mb-3">📊 توقعات الأداء (عند تطبيق التوصيات)</h5>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg bg-white/10">
                        <p className="text-xs text-white/70 mb-1">زيادة التفاعل</p>
                        <p className="text-2xl font-bold text-emerald-400">
                          {competitorAnalysis.performance_forecast.engagement_increase}
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-white/10">
                        <p className="text-xs text-white/70 mb-1">زيادة الوصول</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {competitorAnalysis.performance_forecast.reach_increase}
                        </p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-white/10">
                        <p className="text-xs text-white/70 mb-1">زيادة التحويلات</p>
                        <p className="text-2xl font-bold text-purple-400">
                          {competitorAnalysis.performance_forecast.conversion_increase}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 30-Day Action Plan */}
                {competitorAnalysis.action_plan_30_days && (
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <h5 className="font-bold mb-3 text-lg">📅 خطة العمل - 30 يوم</h5>
                    <div className="space-y-3">
                      {competitorAnalysis.action_plan_30_days.map((week, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-white/10 border border-white/20">
                          <p className="font-bold mb-2">الأسبوع {week.week}: {week.goal}</p>
                          <ul className="space-y-1 text-sm text-white/90">
                            {week.actions?.map((action, i) => (
                              <li key={i}>→ {action}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

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
              onClick={() => generateAdvancedIdeasMutation.mutate()}
              disabled={generateAdvancedIdeasMutation.isPending}
              className="bg-gradient-to-l from-purple-600 to-blue-600 text-white hover:shadow-lg"
              size="sm"
            >
              {generateAdvancedIdeasMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  تحليل متقدم + أفكار
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {competitorInsights && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                رؤى المنافسين والفرص
              </h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-purple-800 mb-2">استراتيجيات ناجحة:</p>
                  <ul className="space-y-1">
                    {competitorInsights.top_strategies?.map((strategy, i) => (
                      <li key={i} className="text-slate-700">• {strategy}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-purple-800 mb-2">فرص غير مستغلة:</p>
                  <ul className="space-y-1">
                    {competitorInsights.content_gaps?.map((gap, i) => (
                      <li key={i} className="text-slate-700">• {gap}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-purple-800 mb-2">أفضل الصيغ:</p>
                  <ul className="space-y-1">
                    {competitorInsights.best_performing_formats?.map((format, i) => (
                      <li key={i} className="text-slate-700">• {format}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {contentIdeas.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-2 font-semibold">أفكار محتوى متقدمة مع تحليل المنافسين</p>
              <p className="text-sm text-slate-500 mb-4">احصل على أفكار مبتكرة + تحليل الترندات العالمية والمحلية</p>
              <Button
                onClick={() => generateAdvancedIdeasMutation.mutate()}
                disabled={generateAdvancedIdeasMutation.isPending}
                className="bg-gradient-to-l from-purple-600 to-blue-600"
              >
                <Sparkles className="w-4 h-4 ml-2" />
                تحليل متقدم
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
                  <p className="text-sm text-slate-600 mb-2">{idea.description}</p>
                  
                  {idea.competitor_analysis && (
                    <div className="mb-3 p-2 rounded bg-amber-50 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-900 mb-1">تحليل المنافسين:</p>
                      <p className="text-xs text-amber-800">{idea.competitor_analysis}</p>
                    </div>
                  )}

                  {idea.strategic_tip && (
                    <div className="mb-3 p-2 rounded bg-emerald-50 border border-emerald-200">
                      <p className="text-xs font-semibold text-emerald-900 mb-1">💡 نصيحة استراتيجية:</p>
                      <p className="text-xs text-emerald-800">{idea.strategic_tip}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs mb-2">
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

                  <div className="flex gap-2 text-xs">
                    {idea.difficulty && (
                      <Badge className={
                        idea.difficulty === 'سهلة' ? 'bg-green-100 text-green-700' :
                        idea.difficulty === 'متوسطة' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }>
                        صعوبة: {idea.difficulty}
                      </Badge>
                    )}
                    {idea.expected_roi && (
                      <Badge className={
                        idea.expected_roi === 'عالي' ? 'bg-emerald-100 text-emerald-700' :
                        idea.expected_roi === 'متوسط' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }>
                        عائد متوقع: {idea.expected_roi}
                      </Badge>
                    )}
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
                  onClick={() => generateVariationsMutation.mutate()}
                  disabled={generateVariationsMutation.isPending}
                >
                  {generateVariationsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 ml-2" />
                  )}
                  صيغ مختلفة
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
            {/* Rephrase Options */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                إعادة صياغة المحتوى بأساليب مختلفة
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rephraseMutation.mutate('professional')}
                  disabled={rephraseMutation.isPending}
                  className="hover:bg-purple-100 hover:border-purple-400"
                >
                  احترافي رسمي
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rephraseMutation.mutate('friendly')}
                  disabled={rephraseMutation.isPending}
                  className="hover:bg-blue-100 hover:border-blue-400"
                >
                  ودود قريب
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rephraseMutation.mutate('enthusiastic')}
                  disabled={rephraseMutation.isPending}
                  className="hover:bg-emerald-100 hover:border-emerald-400"
                >
                  حماسي متحمس
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rephraseMutation.mutate('educational')}
                  disabled={rephraseMutation.isPending}
                  className="hover:bg-amber-100 hover:border-amber-400"
                >
                  تعليمي إرشادي
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rephraseMutation.mutate('storytelling')}
                  disabled={rephraseMutation.isPending}
                  className="hover:bg-pink-100 hover:border-pink-400"
                >
                  قصصي سردي
                </Button>
              </div>
              {rephraseMutation.isPending && (
                <div className="mt-3 flex items-center gap-2 text-sm text-purple-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري إعادة الصياغة بأسلوب جديد...
                </div>
              )}
            </div>

            {/* Content Variations */}
            {showVariations && contentVariations.length > 0 && (
              <Card className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      5 صيغ مختلفة من المحتوى
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowVariations(false)}
                    >
                      إخفاء
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contentVariations.map((variation, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => {
                        setEditedTitle(variation.title);
                        setEditedText(variation.content);
                        setShowVariations(false);
                        toast.success(`تم اختيار: ${variation.label}`);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-bold text-slate-900">{variation.label}</h5>
                          <p className="text-xs text-slate-600">{variation.platform}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {variation.word_count} كلمة
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 mb-2 line-clamp-2">{variation.content}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge className="bg-emerald-100 text-emerald-700">
                          مثالي لـ: {variation.best_for}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

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