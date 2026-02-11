import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get active templates with auto_create enabled
    const templates = await base44.asServiceRole.entities.CampaignTemplate.filter({ auto_create: true });
    
    const createdCampaigns = [];
    
    for (const template of templates) {
      let shouldCreate = false;
      const now = new Date();
      
      if (!template.last_auto_created) {
        shouldCreate = true;
      } else {
        const lastCreated = new Date(template.last_auto_created);
        const daysSinceCreated = Math.ceil((now - lastCreated) / (1000 * 60 * 60 * 24));
        
        if (template.auto_create_frequency === 'daily' && daysSinceCreated >= 1) {
          shouldCreate = true;
        } else if (template.auto_create_frequency === 'weekly' && daysSinceCreated >= 7) {
          shouldCreate = true;
        } else if (template.auto_create_frequency === 'monthly' && daysSinceCreated >= 30) {
          shouldCreate = true;
        }
      }
      
      if (shouldCreate) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (template.duration_days || 30));
        
        const newCampaign = await base44.asServiceRole.entities.Campaign.create({
          campaign_name: `${template.template_name} - ${startDate.toLocaleDateString('ar-SA')}`,
          campaign_description: template.template_description || '',
          campaign_goal: template.campaign_goal,
          target_audience: template.target_audience || {},
          selected_platforms: template.selected_platforms || [],
          budget: template.default_budget || 0,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'draft',
          content_ids: [],
          created_by: template.created_by
        });
        
        // Update template
        await base44.asServiceRole.entities.CampaignTemplate.update(template.id, {
          last_auto_created: now.toISOString(),
          usage_count: (template.usage_count || 0) + 1
        });
        
        // Create notification
        await base44.asServiceRole.entities.Notification.create({
          notification_type: 'automation_executed',
          title: 'تم إنشاء حملة جديدة تلقائياً',
          message: `تم إنشاء الحملة "${newCampaign.campaign_name}" من القالب "${template.template_name}"`,
          priority: 'medium',
          related_entity_type: 'campaign',
          related_entity_id: newCampaign.id,
          action_url: `/Campaigns`,
          created_by: template.created_by
        });
        
        createdCampaigns.push({
          campaign_id: newCampaign.id,
          campaign_name: newCampaign.campaign_name,
          template_name: template.template_name
        });
      }
    }
    
    return Response.json({
      success: true,
      created: createdCampaigns.length,
      campaigns: createdCampaigns
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});