import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Star,
  Copy,
  Search,
  Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    template_name: '',
    template_content: '',
    category: 'general',
    seo_keywords: '',
    trend_tags: []
  });

  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Template.filter({ created_by: user.email }, '-created_date');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setIsDialogOpen(false);
      resetForm();
      toast.success('تم حفظ القالب بنجاح');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Template.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setIsDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      toast.success('تم تحديث القالب بنجاح');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Template.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      toast.success('تم حذف القالب');
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => 
      base44.entities.Template.update(id, { is_favorite: !isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
    }
  });

  const categoryLabels = {
    general: 'عام',
    product: 'منتج',
    service: 'خدمة',
    offer: 'عرض',
    seasonal: 'موسمي',
    announcement: 'إعلان'
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.template_content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      template_name: '',
      template_content: '',
      category: 'general',
      seo_keywords: '',
      trend_tags: []
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      template_content: template.template_content,
      category: template.category,
      seo_keywords: template.seo_keywords || '',
      trend_tags: template.trend_tags || []
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.template_name.trim() || !formData.template_content.trim()) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    const data = {
      ...formData,
      trend_tags: formData.trend_tags.filter(tag => tag.trim())
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDuplicate = (template) => {
    setFormData({
      template_name: template.template_name + ' (نسخة)',
      template_content: template.template_content,
      category: template.category,
      seo_keywords: template.seo_keywords || '',
      trend_tags: template.trend_tags || []
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">قوالب المحتوى</h1>
          <p className="text-slate-600 text-lg">أنشئ وأدر قوالبك الجاهزة لتسريع إنشاء المحتوى</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-5 h-5 ml-2" />
              قالب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  اسم القالب *
                </label>
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="مثال: عرض خاص للصيف"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  الفئة
                </label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  محتوى القالب *
                </label>
                <Textarea
                  value={formData.template_content}
                  onChange={(e) => setFormData({ ...formData, template_content: e.target.value })}
                  placeholder="اكتب نص القالب هنا..."
                  rows={8}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  الكلمات المفتاحية (SEO)
                </label>
                <Input
                  value={formData.seo_keywords}
                  onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                  placeholder="كلمة1, كلمة2, كلمة3"
                />
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
                  {editingTemplate ? 'حفظ التعديلات' : 'إنشاء القالب'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="glass-card border-slate-200/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="ابحث في القوالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="جميع الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery || selectedCategory !== 'all' ? 'لا توجد نتائج' : 'لا توجد قوالب بعد'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery || selectedCategory !== 'all' 
                ? 'جرب البحث بكلمات مختلفة أو اختر فئة أخرى'
                : 'ابدأ بإنشاء قالبك الأول لتسريع عملية إنشاء المحتوى'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-5 h-5 ml-2" />
                إنشاء قالب جديد
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="glass-card hover-lift border-slate-200/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 flex items-center gap-2">
                      {template.template_name}
                      {template.is_favorite && (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      )}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {categoryLabels[template.category]}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavoriteMutation.mutate({ 
                      id: template.id, 
                      isFavorite: template.is_favorite 
                    })}
                  >
                    <Star className={`w-4 h-4 ${template.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-700 line-clamp-3">
                  {template.template_content}
                </p>

                {template.seo_keywords && (
                  <div className="flex flex-wrap gap-1">
                    {template.seo_keywords.split(',').slice(0, 3).map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword.trim()}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="w-3 h-3" />
                  استُخدم {template.usage_count || 0} مرة
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="flex-1"
                  >
                    <Edit3 className="w-4 h-4 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
                        deleteMutation.mutate(template.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}