import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Crown, 
  Zap,
  Sparkles,
  TrendingUp,
  Brain
} from 'lucide-react';
import { toast } from 'sonner';

const plans = [
  {
    id: 'basic',
    name: 'الباقة الأساسية',
    price: '99',
    period: 'شهرياً',
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
    features: [
      { text: '50 محتوى شهرياً', included: true },
      { text: 'متجر واحد متصل', included: true },
      { text: '3 حسابات سوشيال ميديا', included: true },
      { text: 'تحليلات أساسية', included: true },
      { text: 'قوالب جاهزة', included: true },
      { text: 'تحليل الترندات', included: false },
      { text: 'تدريب AI متقدم', included: false },
      { text: 'اقتراحات ذكية', included: false },
    ]
  },
  {
    id: 'professional',
    name: 'الباقة الاحترافية',
    price: '249',
    period: 'شهرياً',
    icon: Sparkles,
    color: 'from-emerald-500 to-emerald-600',
    popular: true,
    features: [
      { text: '200 محتوى شهرياً', included: true },
      { text: '3 متاجر متصلة', included: true },
      { text: '10 حسابات سوشيال ميديا', included: true },
      { text: 'تحليلات متقدمة', included: true },
      { text: 'قوالب جاهزة', included: true },
      { text: 'تحليل الترندات', included: true },
      { text: 'تدريب AI متقدم', included: true },
      { text: 'اقتراحات ذكية', included: false },
    ]
  },
  {
    id: 'premium',
    name: 'الباقة المتقدمة',
    price: '499',
    period: 'شهرياً',
    icon: Crown,
    color: 'from-purple-500 to-purple-600',
    features: [
      { text: 'محتوى غير محدود', included: true },
      { text: 'متاجر غير محدودة', included: true },
      { text: 'حسابات غير محدودة', included: true },
      { text: 'تحليلات متقدمة', included: true },
      { text: 'قوالب جاهزة', included: true },
      { text: 'تحليل الترندات', included: true },
      { text: 'تدريب AI متقدم', included: true },
      { text: 'اقتراحات ذكية', included: true },
    ]
  }
];

export default function Pricing() {
  const queryClient = useQueryClient();

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const subs = await base44.entities.Subscription.filter({ user_email: user.email });
      return subs[0] || null;
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planType) => {
      const user = await base44.auth.me();
      
      const planConfig = {
        basic: {
          content_quota: 50,
          max_stores: 1,
          max_social_accounts: 3,
          has_trend_analysis: false,
          has_advanced_analytics: false,
          has_ai_suggestions: false
        },
        professional: {
          content_quota: 200,
          max_stores: 3,
          max_social_accounts: 10,
          has_trend_analysis: true,
          has_advanced_analytics: true,
          has_ai_suggestions: false
        },
        premium: {
          content_quota: -1,
          max_stores: -1,
          max_social_accounts: -1,
          has_trend_analysis: true,
          has_advanced_analytics: true,
          has_ai_suggestions: true
        }
      };

      if (subscription) {
        return await base44.entities.Subscription.update(subscription.id, {
          plan_type: planType,
          ...planConfig[planType],
          status: 'active',
          content_used: 0
        });
      } else {
        return await base44.entities.Subscription.create({
          user_email: user.email,
          plan_type: planType,
          billing_cycle: 'monthly',
          ...planConfig[planType],
          status: 'active',
          start_date: new Date().toISOString().split('T')[0]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription']);
      toast.success('تم تحديث الباقة بنجاح');
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">اختر الباقة المناسبة لك</h1>
        <p className="text-lg text-slate-600">خطط مرنة تناسب جميع احتياجاتك التسويقية</p>
      </div>

      {subscription && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-slate-600">باقتك الحالية</p>
                <p className="text-xl font-bold text-slate-900">
                  {subscription.plan_type === 'basic' ? 'الباقة الأساسية' : 
                   subscription.plan_type === 'professional' ? 'الباقة الاحترافية' : 'الباقة المتقدمة'}
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm text-slate-600">الاستخدام الشهري</p>
                <p className="text-xl font-bold text-slate-900">
                  {subscription.content_used || 0} / {subscription.content_quota === -1 ? '∞' : subscription.content_quota}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = subscription?.plan_type === plan.id;
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-2 border-emerald-500 shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 right-0 left-0 flex justify-center">
                  <Badge className="bg-emerald-600 text-white px-4 py-1">الأكثر طلباً</Badge>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-4 right-0 left-0 flex justify-center">
                  <Badge className="bg-blue-600 text-white px-4 py-1">الباقة الحالية</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pt-8">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-600 mr-2">SAR</span>
                  <p className="text-sm text-slate-600 mt-1">{plan.period}</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.included ? 'text-green-600' : 'text-slate-300'}`} />
                      <span className={`text-sm ${feature.included ? 'text-slate-700' : 'text-slate-400'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${plan.popular ? `bg-gradient-to-r ${plan.color} text-white` : ''}`}
                  variant={isCurrentPlan ? 'outline' : 'default'}
                  size="lg"
                  disabled={isCurrentPlan || upgradeMutation.isPending}
                  onClick={() => upgradeMutation.mutate(plan.id)}
                >
                  {isCurrentPlan ? 'الباقة الحالية' : 'اختر الباقة'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <Brain className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">ذكاء اصطناعي متقدم</h3>
              <p className="text-sm text-slate-600">محتوى مخصص يتعلم من أسلوبك</p>
            </div>
            <div>
              <TrendingUp className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">تحليل الترندات</h3>
              <p className="text-sm text-slate-600">ابقَ في صدارة المنافسة</p>
            </div>
            <div>
              <Crown className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">دعم مميز</h3>
              <p className="text-sm text-slate-600">فريق الدعم جاهز لمساعدتك</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}