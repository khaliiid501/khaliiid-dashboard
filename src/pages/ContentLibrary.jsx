import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Search, 
  Eye, 
  Heart, 
  MousePointerClick,
  Calendar,
  Trash2,
  Edit3
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function ContentLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: allContent = [] } = useQuery({
    queryKey: ['contentLibrary'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Content.filter({ created_by: user.email }, '-created_date');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Content.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contentLibrary']);
      toast.success('تم حذف المحتوى');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Content.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['contentLibrary']);
      toast.success('تم تحديث الحالة');
    }
  });

  const filteredContent = allContent.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.content_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const draftContent = filteredContent.filter(c => c.status === 'draft');
  const approvedContent = filteredContent.filter(c => c.status === 'approved');
  const publishedContent = filteredContent.filter(c => c.status === 'published');

  const renderContentCard = (content) => (
    <Card key={content.id} className="hover:shadow-md transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{content.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={
                content.status === 'published' ? 'default' : 
                content.status === 'approved' ? 'secondary' : 'outline'
              }>
                {content.status === 'published' ? 'منشور' : 
                 content.status === 'approved' ? 'معتمد' : 'مسودة'}
              </Badge>
              <Badge variant="outline">
                {content.content_type === 'idea' ? 'من فكرة' : 'من رابط'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-700 line-clamp-3">
          {content.content_text}
        </p>

        {content.status === 'published' && (
          <div className="flex items-center gap-4 text-sm text-slate-600 p-3 rounded-lg bg-slate-50">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {content.performance_views || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {content.performance_engagement || 0}%
            </span>
            <span className="flex items-center gap-1">
              <MousePointerClick className="w-4 h-4" />
              {content.performance_conversions || 0}
            </span>
          </div>
        )}

        {content.seo_keywords && (
          <div className="flex flex-wrap gap-1">
            {content.seo_keywords.split(',').slice(0, 4).map((keyword, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {keyword.trim()}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          {new Date(content.created_date).toLocaleDateString('ar-SA')}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          {content.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatusMutation.mutate({ id: content.id, status: 'approved' })}
              className="flex-1"
            >
              اعتماد
            </Button>
          )}
          {content.status === 'approved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatusMutation.mutate({ id: content.id, status: 'published' })}
              className="flex-1"
            >
              نشر
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('هل أنت متأكد من حذف هذا المحتوى؟')) {
                deleteMutation.mutate(content.id);
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">مكتبة المحتوى</h1>
        <p className="text-slate-600">جميع محتوياتك في مكان واحد</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="ابحث في المحتوى..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودات</SelectItem>
                <SelectItem value="approved">معتمد</SelectItem>
                <SelectItem value="published">منشور</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{draftContent.length}</p>
            <p className="text-sm text-slate-600">مسودة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{approvedContent.length}</p>
            <p className="text-sm text-slate-600">معتمد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{publishedContent.length}</p>
            <p className="text-sm text-slate-600">منشور</p>
          </CardContent>
        </Card>
      </div>

      {/* Content List */}
      {filteredContent.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'لا توجد نتائج' : 'لا يوجد محتوى بعد'}
            </h3>
            <p className="text-slate-600">
              {searchQuery || statusFilter !== 'all' 
                ? 'جرب البحث بكلمات مختلفة أو اختر حالة أخرى'
                : 'ابدأ بإنشاء محتوى جديد من صفحة إنشاء المحتوى'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">الكل ({filteredContent.length})</TabsTrigger>
            <TabsTrigger value="draft">مسودات ({draftContent.length})</TabsTrigger>
            <TabsTrigger value="approved">معتمد ({approvedContent.length})</TabsTrigger>
            <TabsTrigger value="published">منشور ({publishedContent.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContent.map(renderContentCard)}
            </div>
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftContent.map(renderContentCard)}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedContent.map(renderContentCard)}
            </div>
          </TabsContent>

          <TabsContent value="published" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedContent.map(renderContentCard)}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}