import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get active automation rules
    const rules = await base44.asServiceRole.entities.AutomationRule.filter({ is_active: true });
    
    // Get all active campaigns
    const campaigns = await base44.asServiceRole.entities.Campaign.filter({ status: 'active' });
    
    const results = [];
    
    for (const rule of rules) {
      const targetCampaigns = rule.target_campaigns && rule.target_campaigns.length > 0
        ? campaigns.filter(c => rule.target_campaigns.includes(c.id))
        : campaigns;
      
      for (const campaign of targetCampaigns) {
        let shouldExecute = false;
        
        // Check trigger conditions
        if (rule.rule_type === 'performance_based') {
          const roi = campaign.roi || 0;
          const reach = campaign.total_reach || 0;
          const engagement = campaign.total_engagement || 0;
          
          if (rule.trigger_condition.metric === 'roi' && roi >= rule.trigger_condition.threshold) {
            shouldExecute = true;
          } else if (rule.trigger_condition.metric === 'reach' && reach >= rule.trigger_condition.threshold) {
            shouldExecute = true;
          } else if (rule.trigger_condition.metric === 'engagement' && engagement >= rule.trigger_condition.threshold) {
            shouldExecute = true;
          }
        } else if (rule.rule_type === 'budget_based') {
          const budgetUsage = campaign.budget > 0 
            ? ((campaign.spent_budget || 0) / campaign.budget) * 100 
            : 0;
          
          if (rule.trigger_condition.type === 'usage_above' && budgetUsage >= rule.trigger_condition.threshold) {
            shouldExecute = true;
          } else if (rule.trigger_condition.type === 'usage_below' && budgetUsage <= rule.trigger_condition.threshold) {
            shouldExecute = true;
          }
        }
        
        if (shouldExecute) {
          // Execute action
          let actionResult = null;
          
          if (rule.action_type === 'increase_budget') {
            const increaseAmount = (campaign.budget * (rule.action_params.percentage || 10)) / 100;
            const newBudget = campaign.budget + increaseAmount;
            
            await base44.asServiceRole.entities.Campaign.update(campaign.id, {
              budget: newBudget
            });
            
            actionResult = `زيادة الميزانية من ${campaign.budget} إلى ${newBudget}`;
          } else if (rule.action_type === 'decrease_budget') {
            const decreaseAmount = (campaign.budget * (rule.action_params.percentage || 10)) / 100;
            const newBudget = Math.max(campaign.budget - decreaseAmount, 0);
            
            await base44.asServiceRole.entities.Campaign.update(campaign.id, {
              budget: newBudget
            });
            
            actionResult = `تقليل الميزانية من ${campaign.budget} إلى ${newBudget}`;
          } else if (rule.action_type === 'pause_campaign') {
            await base44.asServiceRole.entities.Campaign.update(campaign.id, {
              status: 'paused'
            });
            
            actionResult = 'إيقاف الحملة مؤقتاً';
          } else if (rule.action_type === 'send_notification') {
            await base44.asServiceRole.entities.Notification.create({
              notification_type: 'automation_executed',
              title: `تنفيذ قاعدة تلقائية: ${rule.rule_name}`,
              message: rule.action_params.message || `تم تطبيق القاعدة على الحملة ${campaign.campaign_name}`,
              priority: 'high',
              related_entity_type: 'campaign',
              related_entity_id: campaign.id,
              created_by: campaign.created_by
            });
            
            actionResult = 'إرسال إشعار';
          }
          
          // Update rule execution info
          await base44.asServiceRole.entities.AutomationRule.update(rule.id, {
            last_executed: new Date().toISOString(),
            execution_count: (rule.execution_count || 0) + 1
          });
          
          results.push({
            rule: rule.rule_name,
            campaign: campaign.campaign_name,
            action: actionResult,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    return Response.json({
      success: true,
      executed: results.length,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});