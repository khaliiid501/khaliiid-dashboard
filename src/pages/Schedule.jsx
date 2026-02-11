import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { 
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { format, parseISO, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [selectedCampaign, setSelectedCampaign] = useState('');

  const queryClient = useQueryClient();

  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['scheduledPosts'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.ScheduledPost.filter({ created_by: user.email }, '-scheduled_date');
    },
  });

  const { data: contents = [] } = useQuery({
    queryKey: ['publishableContent'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Content.filter({ 
        created_by: user.email,
        status: ['approved', 'published']
      });
    },
  });

  const { data: platforms = [] } = useQuery({
    queryKey: ['activePlatforms'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.ConnectedPlatform.filter({ 
        created_by: user.email,
        is_active: true 
      });
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['activeCampaigns'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Campaign.filter({ 
        created_by: user.email,
        status: 'active'
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ScheduledPost.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledPosts']);
      setIsDialogOpen(false);
      resetForm();
      toast.success('تم جدولة المنشور بنجاح');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledPosts']);
      toast.success('تم إلغاء الجدولة');
    }
  });

  const resetForm = () => {
    setSelectedContent('');
    setSelectedPlatforms([]);
    setScheduledTime('12:00');
    setSelectedCampaign('');
  };

  const handleSchedule = () => {
    if (!selectedContent || selectedPlatforms.length === 0) {
      toast.error('الرجاء اختيار محتوى ومنصة واحدة على الأقل');
      return;
    }

    const scheduledDateTime = new Date(selectedDate);
    const [hours, minutes] = scheduledTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (scheduledDateTime <= new Date()) {
      toast.error('يجب اختيار وقت في المستقبل');
      return;
    }

    createMutation.mutate({
      content_id: selectedContent,
      campaign_id: selectedCampaign || null,
      platform_ids: selectedPlatforms,
      scheduled_date: scheduledDateTime.toISOString(),
      status: 'pending'
    });
  };

  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      published: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      cancelled: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'قيد الانتظار',
      published: 'تم النشر',
      failed: 'فشل',
      cancelled: 'ملغي'
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'published': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const postsForSelectedDate = scheduledPosts.filter(post => {
    const postDate = parseISO(post.scheduled_date);
    return isSameDay(postDate, selectedDate);
  });

  const pendingPosts = scheduledPosts.filter(p => p.status === 'pending');
  const publishedPosts = scheduledPosts.filter(p => p.status === 'published');
  const failedPosts = scheduledPosts.filter(p => p.status === 'failed');

  // Get dates with scheduled posts for calendar highlighting
  const datesWithPosts = scheduledPosts.reduce((acc, post) => {
    const date = format(parseISO(post.scheduled_date), 'yyyy-MM-dd');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">جدولة المنشورات</h1>
          <p className="text-slate-600">خطط ونشر محتواك تلقائياً</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} size="lg">
              <Plus className="w-5 h-5 ml-2" />
              جدولة منشور
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>جدولة منشور جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  اختر المحتوى *
                </label>
                <Select value={selectedContent} onValueChange={setSelectedContent}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر محتوى للنشر" />
                  </SelectTrigger>
                  <SelectContent>
                    {contents.map((content) => (
                      <SelectItem key={content.id} value={content.id}>
                        {content.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ربط بحملة (اختياري)
                </label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder="بدون حملة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>بدون حملة</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.campaign_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  المنصات المستهدفة *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {platforms.map((platform) => (
                    <Button
                      key={platform.id}
                      type="button"
                      variant={selectedPlatforms.includes(platform.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => togglePlatform(platform.id)}
                      className="justify-start"
                    >
                      {selectedPlatforms.includes(platform.id) && (
                        <CheckCircle className="w-4 h-4 ml-2" />
                      )}
                      {platform.account_name} ({platform.platform_name})
                    </Button>
                  ))}
                </div>
                {platforms.length === 0 && (
                  <p className="text-sm text-slate-500">لا توجد منصات متصلة</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    التاريخ *
                  </label>
                  <div className="border rounded-lg p-3">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={ar}
                      disabled={(date) => date < new Date()}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    الوقت *
                  </label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    التاريخ المحدد: {format(selectedDate, 'dd/MM/yyyy')} الساعة {scheduledTime}
                  </p>
                </div>
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
                  onClick={handleSchedule}
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <CalendarIcon className="w-4 h-4 ml-2" />
                  )}
                  جدولة المنشور
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">قيد الانتظار</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{pendingPosts.length}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">تم النشر</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{publishedPosts.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">فشل</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{failedPosts.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>التقويم</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ar}
              className="rounded-md border"
              modifiers={{
                scheduled: (date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  return datesWithPosts[dateStr] > 0;
                }
              }}
              modifiersStyles={{
                scheduled: {
                  fontWeight: 'bold',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af'
                }
              }}
            />
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
              <p className="text-blue-900 font-medium">التواريخ المميزة</p>
              <p className="text-blue-700 text-xs mt-1">تحتوي على منشورات مجدولة</p>
            </div>
          </CardContent>
        </Card>

        {/* Posts for selected date */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              المنشورات المجدولة - {format(selectedDate, 'dd/MM/yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {postsForSelectedDate.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">لا توجد منشورات في هذا اليوم</h3>
                <p className="text-slate-600 mb-6">اختر يوماً آخر أو قم بجدولة منشور جديد</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  جدولة منشور
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {postsForSelectedDate.map((post) => {
                  const content = contents.find(c => c.id === post.content_id);
                  const postPlatforms = platforms.filter(p => post.platform_ids?.includes(p.id));
                  
                  return (
                    <div key={post.id} className="p-4 rounded-lg border hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{content?.title || 'محتوى محذوف'}</h4>
                          <p className="text-sm text-slate-600 mt-1">
                            {format(parseISO(post.scheduled_date), 'HH:mm')}
                          </p>
                        </div>
                        <Badge className={getStatusColor(post.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(post.status)}
                            {getStatusLabel(post.status)}
                          </span>
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {postPlatforms.map((platform) => (
                          <Badge key={platform.id} variant="secondary" className="text-xs">
                            {platform.platform_name}
                          </Badge>
                        ))}
                      </div>

                      {post.error_message && (
                        <div className="p-2 bg-red-50 rounded text-xs text-red-700 mb-3">
                          {post.error_message}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {content && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              toast.info(content.content_text);
                            }}
                          >
                            <Eye className="w-4 h-4 ml-1" />
                            معاينة
                          </Button>
                        )}
                        {post.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('هل أنت متأكد من إلغاء هذه الجدولة؟')) {
                                deleteMutation.mutate(post.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Scheduled Posts */}
      {scheduledPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>جميع المنشورات المجدولة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scheduledPosts.slice(0, 10).map((post) => {
                const content = contents.find(c => c.id === post.content_id);
                const postDate = parseISO(post.scheduled_date);
                
                return (
                  <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{content?.title || 'محتوى محذوف'}</p>
                      <p className="text-sm text-slate-600">
                        {format(postDate, 'dd/MM/yyyy - HH:mm')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(post.status)}>
                      {getStatusLabel(post.status)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}