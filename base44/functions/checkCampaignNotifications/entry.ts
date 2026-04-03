import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active campaigns
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ status: 'active' });
    
    const notifications = [];
    
    for (const campaign of campaigns) {
      const budgetUsage = campaign.budget > 0 
        ? ((campaign.spent_budget || 0) / campaign.budget) * 100 
        : 0;
      
      // Budget warning (80% threshold)
      if (budgetUsage >= 80 && budgetUsage < 100) {
        const existingNotifications = await base44.asServiceRole.entities.Notification.filter({
          related_entity_id: campaign.id,
          notification_type: 'budget_warning',
          is_read: false
        });
        
        if (existingNotifications.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            notification_type: 'budget_warning',
            title: 'تحذير: اقتراب الميزانية من النفاد',
            message: `الحملة "${campaign.campaign_name}" استخدمت ${budgetUsage.toFixed(0)}% من الميزانية`,
            priority: 'high',
            related_entity_type: 'campaign',
            related_entity_id: campaign.id,
            action_url: `/Campaigns`,
            created_by: campaign.created_by
          });
          
          notifications.push({
            type: 'budget_warning',
            campaign: campaign.campaign_name,
            usage: budgetUsage.toFixed(0)
          });
        }
      }
      
      // Budget exceeded
      if (budgetUsage >= 100) {
        const existingNotifications = await base44.asServiceRole.entities.Notification.filter({
          related_entity_id: campaign.id,
          notification_type: 'budget_warning',
          priority: 'urgent',
          is_read: false
        });
        
        if (existingNotifications.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            notification_type: 'budget_warning',
            title: 'عاجل: تجاوز الميزانية!',
            message: `الحملة "${campaign.campaign_name}" تجاوزت الميزانية المحددة`,
            priority: 'urgent',
            related_entity_type: 'campaign',
            related_entity_id: campaign.id,
            action_url: `/Campaigns`,
            created_by: campaign.created_by
          });
          
          notifications.push({
            type: 'budget_exceeded',
            campaign: campaign.campaign_name
          });
        }
      }
      
      // Performance alert (high ROI)
      if ((campaign.roi || 0) >= 100) {
        const existingNotifications = await base44.asServiceRole.entities.Notification.filter({
          related_entity_id: campaign.id,
          notification_type: 'performance_alert',
          is_read: false
        });
        
        if (existingNotifications.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            notification_type: 'performance_alert',
            title: 'أداء ممتاز!',
            message: `الحملة "${campaign.campaign_name}" تحقق ROI ${campaign.roi}%. فكر في زيادة الميزانية`,
            priority: 'medium',
            related_entity_type: 'campaign',
            related_entity_id: campaign.id,
            action_url: `/Campaigns`,
            created_by: campaign.created_by
          });
          
          notifications.push({
            type: 'performance_alert',
            campaign: campaign.campaign_name,
            roi: campaign.roi
          });
        }
      }
      
      // Campaign ending soon (3 days)
      const endDate = new Date(campaign.end_date);
      const today = new Date();
      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 3 && daysLeft > 0) {
        const existingNotifications = await base44.asServiceRole.entities.Notification.filter({
          related_entity_id: campaign.id,
          notification_type: 'campaign_completed',
          is_read: false
        });
        
        if (existingNotifications.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            notification_type: 'campaign_completed',
            title: 'تنبيه: اقتراب انتهاء الحملة',
            message: `الحملة "${campaign.campaign_name}" ستنتهي خلال ${daysLeft} أيام`,
            priority: 'medium',
            related_entity_type: 'campaign',
            related_entity_id: campaign.id,
            action_url: `/Campaigns`,
            created_by: campaign.created_by
          });
          
          notifications.push({
            type: 'campaign_ending',
            campaign: campaign.campaign_name,
            daysLeft
          });
        }
      }
    }
    
    return Response.json({
      success: true,
      notifications_created: notifications.length,
      notifications
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});