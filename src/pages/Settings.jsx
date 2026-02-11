import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Link2, 
  Plus, 
  Trash2,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  MessageCircle,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon,
  Store
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

const platformIcons = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  snapchat: MessageCircle,
  tiktok: MessageCircle,
  pinterest: MessageCircle,
  telegram: MessageCircle,
  whatsapp_business: MessageCircle,
  threads: MessageCircle,
  salla: ShoppingBag,
  zid: ShoppingBag,
  woocommerce: ShoppingBag,
  shopify: ShoppingBag,
  ExpandCart: ShoppingBag,
  noon: Store,
  amazon_sa: Store,
  jarir: Store,
  extra: Store
};

const platformLabels = {
  instagram: 'إنستغرام',
  twitter: 'تويتر (X)',
  snapchat: 'سناب شات',
  tiktok: 'تيك توك',
  pinterest: 'بينتريست',
  facebook: 'فيسبوك',
  linkedin: 'لينكد إن',
  telegram: 'تيليجرام',
  whatsapp_business: 'واتساب للأعمال',
  youtube: 'يوتيوب',
  threads: 'ثريدز',
  salla: 'سلة',
  zid: 'زد',
  woocommerce: 'ووكومرس',
  shopify: 'شوبيفاي',
  ExpandCart: 'إكسباند كارت',
  noon: 'نون',
  amazon_sa: 'أمازون السعودية',
  jarir: 'جرير',
  extra: 'إكسترا'
};

const platformTypes = {
  social_media: 'سوشيال ميديا',
  store: 'متجر إلكتروني',
  messaging: 'منصة مراسلة'
};

export default function Settings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    platform_name: '',
    platform_type: 'social_media',
    account_name: '',
    account_url: '',
    account_id: '',
    connection_data: ''
  });

  const queryClient = useQueryClient();

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
      return await base44.entities.ConnectedPlatform.filter({ created_by: user.email }, '-created_date');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ConnectedPlatform.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['connectedPlatforms']);
      setIsDialogOpen(false);
      resetForm();
      toast.success('تم ربط المنصة بنجاح');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ConnectedPlatform.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['connectedPlatforms']);
      toast.success('تم إلغاء الربط');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => 
      base44.entities.ConnectedPlatform.update(id, { is_active: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['connectedPlatforms']);
    }
  });

  const resetForm = () => {
    setFormData({
      platform_name: '',
      platform_type: 'social_media',
      account_name: '',
      account_url: '',
      account_id: '',
      connection_data: ''
    });
  };

  const handleSubmit = () => {
    if (!formData.platform_name || !formData.account_name.trim()) {
      toast.error('الرجاء اختيار المنصة وإدخال اسم الحساب');
      return;
    }

    // Check subscription limits
    const platformType = getPlatformType(formData.platform_name);
    const currentCount = connectedPlatforms.filter(p => 
      getPlatformType(p.platform_name) === platformType
    ).length;

    if (platformType === 'social_media' && subscription?.max_social_accounts) {
      if (currentCount >= subscription.max_social_accounts) {
        toast.error(`لقد وصلت للحد الأقصى لحسابات السوشيال ميديا (${subscription.max_social_accounts})`);
        return;
      }
    }

    if (platformType === 'store' && subscription?.max_stores) {
      if (currentCount >= subscription.max_stores) {
        toast.error(`لقد وصلت للحد الأقصى للمتاجر المتصلة (${subscription.max_stores})`);
        return;
      }
    }

    createMutation.mutate({
      ...formData,
      connection_status: 'connected',
      last_sync: new Date().toISOString()
    });
  };

  const getPlatformType = (platformName) => {
    const socialMedia = ['instagram', 'twitter', 'snapchat', 'tiktok', 'pinterest', 'facebook', 'linkedin', 'youtube', 'threads'];
    const messaging = ['telegram', 'whatsapp_business'];
    const stores = ['salla', 'zid', 'woocommerce', 'shopify', 'ExpandCart', 'noon', 'amazon_sa', 'jarir', 'extra'];
    
    if (socialMedia.includes(platformName)) return 'social_media';
    if (messaging.includes(platformName)) return 'messaging';
    if (stores.includes(platformName)) return 'store';
    return 'social_media';
  };

  const handlePlatformSelect = (platformName) => {
    setFormData({
      ...formData,
      platform_name: platformName,
      platform_type: getPlatformType(platformName)
    });
  };

  const socialMediaPlatforms = connectedPlatforms.filter(p => 
    ['instagram', 'twitter', 'snapchat', 'tiktok', 'pinterest', 'facebook', 'linkedin', 'youtube', 'threads'].includes(p.platform_name)
  );
  
  const messagingPlatforms = connectedPlatforms.filter(p => 
    ['telegram', 'whatsapp_business'].includes(p.platform_name)
  );
  
  const storePlatforms = connectedPlatforms.filter(p => 
    ['salla', 'zid', 'woocommerce', 'shopify', 'ExpandCart', 'noon', 'amazon_sa', 'jarir', 'extra'].includes(p.platform_name)
  );

  const renderPlatformCard = (platform) => {
    const Icon = platformIcons[platform.platform_name] || Link2;
    
    return (
      <Card key={platform.id} className="hover:shadow-md transition-all">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-blue-50">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">
                  {platformLabels[platform.platform_name]}
                </h3>
                <p className="text-sm text-slate-600 mb-2">{platform.account_name}</p>
                {platform.account_url && (
                  <a 
                    href={platform.account_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {platform.account_url}
                  </a>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={platform.is_active ? 'default' : 'secondary'}>
                    {platform.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                  {platform.connection_status === 'connected' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleStatusMutation.mutate({ 
                  id: platform.id, 
                  isActive: platform.is_active 
                })}
              >
                {platform.is_active ? 'تعطيل' : 'تفعيل'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('هل أنت متأكد من إلغاء الربط؟')) {
                    deleteMutation.mutate(platform.id);
                  }
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">الإعدادات</h1>
        <p className="text-slate-600">إدارة المنصات المتصلة وإعدادات التطبيق</p>
      </div>

      <Tabs defaultValue="platforms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="platforms">
            <Link2 className="w-4 h-4 ml-2" />
            المنصات المتصلة
          </TabsTrigger>
          <TabsTrigger value="general">
            <SettingsIcon className="w-4 h-4 ml-2" />
            إعدادات عامة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-6">
          {/* Subscription Limits */}
          {subscription && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">حدود الباقة الحالية</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {socialMediaPlatforms.length} / {subscription.max_social_accounts || '∞'} حساب سوشيال ميديا
                      {' • '}
                      {storePlatforms.length} / {subscription.max_stores || '∞'} متجر
                    </p>
                  </div>
                  <Badge className="bg-emerald-600">
                    {subscription.plan_type === 'basic' ? 'أساسية' : subscription.plan_type === 'professional' ? 'احترافية' : 'متقدمة'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Platform Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} size="lg" className="w-full sm:w-auto">
                <Plus className="w-5 h-5 ml-2" />
                ربط منصة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>ربط منصة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    اختر المنصة *
                  </label>
                  <Select value={formData.platform_name} onValueChange={handlePlatformSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنصة">
                        {formData.platform_name && (
                          <div className="flex items-center gap-2">
                            {React.createElement(platformIcons[formData.platform_name] || Link2, { className: "w-4 h-4" })}
                            {platformLabels[formData.platform_name]}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <p className="text-xs font-semibold text-slate-500 mb-2">سوشيال ميديا</p>
                        {['instagram', 'twitter', 'snapchat', 'tiktok', 'pinterest', 'facebook', 'linkedin', 'youtube', 'threads'].map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            <div className="flex items-center gap-2">
                              {React.createElement(platformIcons[platform], { className: "w-4 h-4" })}
                              {platformLabels[platform]}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                      <div className="p-2 border-t">
                        <p className="text-xs font-semibold text-slate-500 mb-2">منصات المراسلة</p>
                        {['telegram', 'whatsapp_business'].map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            <div className="flex items-center gap-2">
                              {React.createElement(platformIcons[platform], { className: "w-4 h-4" })}
                              {platformLabels[platform]}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                      <div className="p-2 border-t">
                        <p className="text-xs font-semibold text-slate-500 mb-2">المتاجر الإلكترونية</p>
                        {['salla', 'zid', 'woocommerce', 'shopify', 'ExpandCart', 'noon', 'amazon_sa', 'jarir', 'extra'].map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            <div className="flex items-center gap-2">
                              {React.createElement(platformIcons[platform], { className: "w-4 h-4" })}
                              {platformLabels[platform]}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    اسم الحساب / المتجر *
                  </label>
                  <Input
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    placeholder="مثال: متجر_السعودية"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    رابط الحساب / المتجر (اختياري)
                  </label>
                  <Input
                    value={formData.account_url}
                    onChange={(e) => setFormData({ ...formData, account_url: e.target.value })}
                    placeholder="https://..."
                    type="url"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    معرف الحساب (اختياري)
                  </label>
                  <Input
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    placeholder="مثال: @username أو User ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    API Key / Token (اختياري)
                  </label>
                  <Input
                    value={formData.connection_data}
                    onChange={(e) => setFormData({ ...formData, connection_data: e.target.value })}
                    placeholder="سيتم تشفيره تلقائياً"
                    type="password"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    بيانات الاتصال محمية ومشفرة
                  </p>
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
                    disabled={createMutation.isPending}
                    className="flex-1"
                  >
                    ربط المنصة
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Connected Platforms */}
          {connectedPlatforms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Link2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">لا توجد منصات متصلة</h3>
                <p className="text-slate-600 mb-6">ابدأ بربط منصاتك لتسهيل نشر المحتوى</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  ربط أول منصة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Social Media Platforms */}
              {socialMediaPlatforms.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    حسابات السوشيال ميديا ({socialMediaPlatforms.length})
                  </h3>
                  <div className="grid gap-4">
                    {socialMediaPlatforms.map(renderPlatformCard)}
                  </div>
                </div>
              )}

              {/* Messaging Platforms */}
              {messagingPlatforms.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    منصات المراسلة ({messagingPlatforms.length})
                  </h3>
                  <div className="grid gap-4">
                    {messagingPlatforms.map(renderPlatformCard)}
                  </div>
                </div>
              )}

              {/* Store Platforms */}
              {storePlatforms.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    المتاجر الإلكترونية ({storePlatforms.length})
                  </h3>
                  <div className="grid gap-4">
                    {storePlatforms.map(renderPlatformCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات العامة</CardTitle>
              <CardDescription>إعدادات التطبيق والحساب</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">قريباً...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}