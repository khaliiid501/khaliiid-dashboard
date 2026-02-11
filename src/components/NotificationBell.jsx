import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function NotificationBell() {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notificationsBell'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.Notification.filter({ created_by: user.email }, '-created_date', 10);
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { 
      is_read: true,
      read_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationsBell']);
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-blue-600',
      low: 'text-slate-600'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 rounded-xl transition-all">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold shadow-lg animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 glass-card border-slate-200/50 shadow-xl" align="end">
        <div className="p-4 border-b border-slate-200/50 bg-gradient-to-l from-blue-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">الإشعارات</h3>
            {unreadCount > 0 && (
              <div className="px-2 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold">
                {unreadCount} جديد
              </div>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-600">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b hover:bg-slate-50 transition-all ${!notification.is_read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className={`font-medium text-sm ${getPriorityColor(notification.priority)}`}>
                    {notification.title}
                  </h4>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                
                <p className="text-xs text-slate-600 mb-2">{notification.message}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {new Date(notification.created_date).toLocaleDateString('ar-SA')}
                  </span>
                  
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markReadMutation.mutate(notification.id)}
                      className="text-xs h-6"
                    >
                      وضع علامة مقروء
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-3 border-t">
          <Link to={createPageUrl('Automation')}>
            <Button variant="ghost" size="sm" className="w-full">
              عرض جميع الإشعارات
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}