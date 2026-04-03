import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Only process updates to ScheduledPost
    if (event.entity_name !== 'ScheduledPost' || event.type !== 'update') {
      return Response.json({ success: true, message: 'Event ignored' });
    }

    // Check if status changed
    const oldStatus = old_data?.status;
    const newStatus = data?.status;

    if (!newStatus || oldStatus === newStatus) {
      return Response.json({ success: true, message: 'No status change' });
    }

    // Only send notifications for published or failed statuses
    if (newStatus !== 'published' && newStatus !== 'failed') {
      return Response.json({ success: true, message: 'Status not relevant' });
    }

    // Get content details
    const content = await base44.asServiceRole.entities.Content.get(data.content_id).catch(() => null);
    
    if (!content) {
      return Response.json({ success: true, message: 'Content not found' });
    }

    // Create notification
    const notificationType = newStatus === 'published' ? 'campaign_completed' : 'performance_alert';
    const title = newStatus === 'published' 
      ? '✅ تم نشر المحتوى بنجاح'
      : '❌ فشل نشر المحتوى';
    
    const message = newStatus === 'published'
      ? `تم نشر "${content.title}" بنجاح على المنصات المحددة`
      : `فشل نشر "${content.title}" - ${data.error_message || 'خطأ غير معروف'}`;

    await base44.asServiceRole.entities.Notification.create({
      notification_type: notificationType,
      title: title,
      message: message,
      priority: newStatus === 'failed' ? 'high' : 'medium',
      related_entity_type: 'content',
      related_entity_id: content.id,
      action_url: '/Schedule',
      is_read: false,
      created_by: data.created_by
    });

    // Send email notification for failures
    if (newStatus === 'failed') {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: data.created_by,
          subject: 'تنبيه: فشل نشر محتوى مجدول',
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">⚠️ فشل نشر المحتوى</h2>
              <p>عزيزي المستخدم،</p>
              <p>للأسف، فشل نشر المحتوى التالي:</p>
              <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>العنوان:</strong> ${content.title}</p>
                <p><strong>السبب:</strong> ${data.error_message || 'خطأ غير معروف'}</p>
                <p><strong>التاريخ المجدول:</strong> ${new Date(data.scheduled_date).toLocaleString('ar-SA')}</p>
              </div>
              <p>يرجى مراجعة الإعدادات وإعادة المحاولة.</p>
              <a href="${Deno.env.get('APP_URL') || ''}/Schedule" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; margin-top: 10px;">
                عرض الجدولة
              </a>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError.message);
      }
    }

    return Response.json({ 
      success: true,
      notification_sent: true,
      status: newStatus
    });

  } catch (error) {
    console.error('Error in sendScheduleNotification:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});