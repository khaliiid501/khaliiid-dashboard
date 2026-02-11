import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Sparkles, 
  Loader2,
  Hash,
  Globe,
  Users,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function Trends() {
  const [trends, setTrends] = useState(null);
  const [activeRegion, setActiveRegion] = useState('saudi');

  const analyzeCurrentTrendsMutation = useMutation({
    mutationFn: async (region) => {
      const regionName = region === 'saudi' ? 'السعودية' : region === 'gulf' ? 'الخليج' : 'العالم العربي';
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `أنت محلل ترندات متخصص في وسائل التواصل الاجتماعي والتجارة الإلكترونية في ${regionName}.

المطلوب: حلل الترندات الحالية (${new Date().toLocaleDateString('ar-SA')}) واستخرج:

1. أهم 10 هاشتاقات رائجة في ${regionName}
2. المواضيع الأكثر بحثاً (تجارة، تقنية، ترفيه، صحة)
3. أفضل أوقات النشر لكل منصة
4. نصائح للاستفادة من هذه الترندات في المحتوى التسويقي

أرجع النتيجة بتنسيق JSON:
{
  "trending_hashtags": [
    {"tag": "#هاشتاق", "category": "الفئة", "popularity": "عدد تقريبي", "description": "وصف مختصر"}
  ],
  "hot_topics": [
    {"topic": "الموضوع", "category": "الفئة", "trend_direction": "صاعد/ثابت/نازل", "description": "وصف"}
  ],
  "best_posting_times": {
    "instagram": "الوقت المفضل",
    "twitter": "الوقت المفضل",
    "snapchat": "الوقت المفضل",
    "tiktok": "الوقت المفضل"
  },
  "marketing_tips": ["نصيحة 1", "نصيحة 2", "نصيحة 3"]
}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            trending_hashtags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tag: { type: "string" },
                  category: { type: "string" },
                  popularity: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            hot_topics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  topic: { type: "string" },
                  category: { type: "string" },
                  trend_direction: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            best_posting_times: {
              type: "object",
              properties: {
                instagram: { type: "string" },
                twitter: { type: "string" },
                snapchat: { type: "string" },
                tiktok: { type: "string" }
              }
            },
            marketing_tips: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      return { ...result, region };
    },
    onSuccess: (data) => {
      setTrends(data);
      toast.success('تم تحليل الترندات بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في تحليل الترندات');
    }
  });

  const handleAnalyze = (region) => {
    setActiveRegion(region);
    analyzeCurrentTrendsMutation.mutate(region);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'تقنية': 'bg-blue-100 text-blue-700',
      'ترفيه': 'bg-purple-100 text-purple-700',
      'رياضة': 'bg-green-100 text-green-700',
      'تجارة': 'bg-amber-100 text-amber-700',
      'صحة': 'bg-rose-100 text-rose-700',
      'موضة': 'bg-pink-100 text-pink-700',
      'طعام': 'bg-orange-100 text-orange-700'
    };
    return colors[category] || 'bg-slate-100 text-slate-700';
  };

  const getTrendIcon = (direction) => {
    if (direction?.includes('صاعد')) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (direction?.includes('نازل')) return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
    return <TrendingUp className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">الترندات والتوجهات</h1>
        <p className="text-slate-600">اكتشف أحدث الترندات في السوق السعودي والخليجي</p>
      </div>

      {/* Region Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">اختر المنطقة للتحليل</h3>
              <p className="text-sm text-slate-600">سنحلل أحدث الترندات في المنطقة المحددة</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeRegion === 'saudi' ? 'default' : 'outline'}
                onClick={() => handleAnalyze('saudi')}
                disabled={analyzeCurrentTrendsMutation.isPending}
              >
                <Globe className="w-4 h-4 ml-2" />
                السعودية
              </Button>
              <Button
                variant={activeRegion === 'gulf' ? 'default' : 'outline'}
                onClick={() => handleAnalyze('gulf')}
                disabled={analyzeCurrentTrendsMutation.isPending}
              >
                <Globe className="w-4 h-4 ml-2" />
                الخليج
              </Button>
              <Button
                variant={activeRegion === 'arab' ? 'default' : 'outline'}
                onClick={() => handleAnalyze('arab')}
                disabled={analyzeCurrentTrendsMutation.isPending}
              >
                <Globe className="w-4 h-4 ml-2" />
                العالم العربي
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {analyzeCurrentTrendsMutation.isPending && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600">جاري تحليل الترندات الحالية...</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {trends && !analyzeCurrentTrendsMutation.isPending && (
        <Tabs defaultValue="hashtags">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hashtags">هاشتاقات</TabsTrigger>
            <TabsTrigger value="topics">مواضيع</TabsTrigger>
            <TabsTrigger value="timing">أوقات النشر</TabsTrigger>
            <TabsTrigger value="tips">نصائح</TabsTrigger>
          </TabsList>

          <TabsContent value="hashtags" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  الهاشتاقات الرائجة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trends.trending_hashtags?.map((hashtag, index) => (
                    <div key={index} className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-blue-600">{hashtag.tag}</h3>
                        <Badge className={getCategoryColor(hashtag.category)}>
                          {hashtag.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{hashtag.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Users className="w-3 h-3" />
                        {hashtag.popularity}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  المواضيع الساخنة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trends.hot_topics?.map((topic, index) => (
                    <div key={index} className="p-4 rounded-lg border hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTrendIcon(topic.trend_direction)}
                            <h3 className="font-bold text-slate-900">{topic.topic}</h3>
                            <Badge className={getCategoryColor(topic.category)}>
                              {topic.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{topic.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  أفضل أوقات النشر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(trends.best_posting_times || {}).map(([platform, time]) => (
                    <div key={platform} className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-blue-50">
                      <h3 className="font-bold text-slate-900 mb-2 capitalize">{platform}</h3>
                      <p className="text-sm text-slate-700">{time}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  نصائح تسويقية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trends.marketing_tips?.map((tip, index) => (
                    <div key={index} className="flex gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-700">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!trends && !analyzeCurrentTrendsMutation.isPending && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">اكتشف الترندات الحالية</h3>
            <p className="text-slate-600 mb-6">اختر منطقة لبدء تحليل أحدث الترندات</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}