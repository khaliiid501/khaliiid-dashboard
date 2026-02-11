import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Trash2,
  Check,
  Eye,
  Calendar as CalendarIcon,
  TrendingUp,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Notifications() {
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['allNotifications'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Notification.filter({ created_by: user.email }, '-created_date');
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { 
      is_read: true,
      read_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allNotifications']);
      queryClient.invalidateQueries(['recentNotifications']);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => 
          base44.entities.Notification.update(n.id, { 
            is_read: true,
            read_at: new Date().toISOString()
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allNotifications']);
      queryClient.invalidateQueries(['recentNotifications']);
      toast.success('تم تعليم جميع الإشعارات كمقروءة');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['allNotifications']);
      toast.success('تم حذف الإشعار');
    }
  });

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      medium: 'bg-blue-100 text-blue-700 border-blue-300',
      low: 'bg-slate-100 text-slate-700 border-slate-300'
    };
    return colors[priority] || colors.medium;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'campaign_completed':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'performance_alert':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'budget_warning':
        return <TrendingUp className="w-5 h-5 text-amber-600" />;
      case 'automation_executed':
        return <Zap className="w-5 h-5 text-blue-600" />;
      case 'content_pending':
        return <Clock className="w-5 h-5 text-slate-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      campaign_completed: 'حملة مكتملة',
      performance_alert: 'تنبيه أداء',
      budget_warning: 'تحذير ميزانية',
      automation_executed: 'تنفيذ تلقائي',
      content_pending: 'محتوى معلق'
    };
    return labels[type] || type;
  };

  const filteredNotifications = filterType === 'all' 
    ? notifications 
    : notifications.filter(n => n.notification_type === filterType);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const unreadNotifications = filteredNotifications.filter(n => !n.is_read);
  const readNotifications = filteredNotifications.filter(n => n.is_read);

  const renderNotification = (notification) => (
    <Card 
      key={notification.id} 
      className={`transition-all hover:shadow-md ${
        notification.is_read ? 'bg-white' : 'bg-blue-50/50 border-blue-200'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            {getTypeIcon(notification.notification_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h4 className={`font-semibold ${notification.is_read ? 'text-slate-900' : 'text-slate-900'}`}>
                  {notification.title}
                </h4>
                <p className="text-sm text-slate-600 mt-1">
                  {notification.message}
                </p>
              </div>
              {!notification.is_read && (
                <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs mt-3">
              <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                {notification.priority === 'urgent' ? 'عاجل' :
                 notification.priority === 'high' ? 'عالية' :
                 notification.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
              </Badge>
              <Badge variant="outline">
                {getTypeLabel(notification.notification_type)}
              </Badge>
              <span className="flex items-center gap-1 text-slate-500">
                <CalendarIcon className="w-3 h-3" />
                {new Date(notification.created_date).toLocaleDateString('en-GB')} {' '}
                {new Date(notification.created_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex gap-2 mt-3">
              {!notification.is_read && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAsReadMutation.mutate(notification.id)}
                >
                  <Check className="w-3 h-3 ml-1" />
                  تعليم كمقروء
                </Button>
              )}
              {notification.action_url && (
                <Link to={createPageUrl(notification.action_url.replace('/', ''))}>
                  <Button size="sm" variant="outline">
                    <Eye className="w-3 h-3 ml-1" />
                    عرض
                  </Button>
                </Link>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm('هل تريد حذف هذا الإشعار؟')) {
                    deleteMutation.mutate(notification.id);
                  }
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">الإشعارات</h1>
              <p className="text-white/90 text-lg">جميع التنبيهات والتحديثات في مكان واحد</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
            >
              <CheckCircle className="w-4 h-4 ml-2" />
              تعليم الكل كمقروء
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">إجمالي الإشعارات</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">غير مقروءة</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{unreadCount}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">مقروءة</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{notifications.length - unreadCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
            >
              الكل ({notifications.length})
            </Button>
            <Button
              size="sm"
              variant={filterType === 'campaign_completed' ? 'default' : 'outline'}
              onClick={() => setFilterType('campaign_completed')}
            >
              نشر ناجح ({notifications.filter(n => n.notification_type === 'campaign_completed').length})
            </Button>
            <Button
              size="sm"
              variant={filterType === 'performance_alert' ? 'default' : 'outline'}
              onClick={() => setFilterType('performance_alert')}
            >
              تنبيهات أداء ({notifications.filter(n => n.notification_type === 'performance_alert').length})
            </Button>
            <Button
              size="sm"
              variant={filterType === 'budget_warning' ? 'default' : 'outline'}
              onClick={() => setFilterType('budget_warning')}
            >
              تحذير ميزانية ({notifications.filter(n => n.notification_type === 'budget_warning').length})
            </Button>
            <Button
              size="sm"
              variant={filterType === 'automation_executed' ? 'default' : 'outline'}
              onClick={() => setFilterType('automation_executed')}
            >
              أتمتة ({notifications.filter(n => n.notification_type === 'automation_executed').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              لا توجد إشعارات
            </h3>
            <p className="text-slate-600">
              {filterType === 'all' 
                ? 'ستظهر هنا جميع التنبيهات والتحديثات'
                : 'لا توجد إشعارات من هذا النوع'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="unread">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unread">
              غير مقروءة ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="read">
              مقروءة ({readNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="mt-6 space-y-3">
            {unreadNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-slate-600">جميع الإشعارات مقروءة!</p>
                </CardContent>
              </Card>
            ) : (
              unreadNotifications.map(renderNotification)
            )}
          </TabsContent>

          <TabsContent value="read" className="mt-6 space-y-3">
            {readNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">لا توجد إشعارات مقروءة</p>
                </CardContent>
              </Card>
            ) : (
              readNotifications.map(renderNotification)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}