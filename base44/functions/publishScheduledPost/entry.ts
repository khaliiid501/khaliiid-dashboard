import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current time
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Find pending posts that should be published now
    const allScheduledPosts = await base44.asServiceRole.entities.ScheduledPost.list();
    
    const postsToPublish = allScheduledPosts.filter(post => {
      if (post.status !== 'pending') return false;
      
      const scheduledDate = new Date(post.scheduled_date);
      return scheduledDate >= fiveMinutesAgo && scheduledDate <= now;
    });

    const results = [];

    for (const post of postsToPublish) {
      try {
        // Get content details
        const content = await base44.asServiceRole.entities.Content.get(post.content_id);
        
        if (!content) {
          await base44.asServiceRole.entities.ScheduledPost.update(post.id, {
            status: 'failed',
            error_message: 'المحتوى غير موجود'
          });
          continue;
        }

        // Get platform details
        const platforms = await Promise.all(
          post.platform_ids.map(id => 
            base44.asServiceRole.entities.ConnectedPlatform.get(id).catch(() => null)
          )
        );

        const validPlatforms = platforms.filter(p => p !== null);

        if (validPlatforms.length === 0) {
          await base44.asServiceRole.entities.ScheduledPost.update(post.id, {
            status: 'failed',
            error_message: 'لا توجد منصات صالحة للنشر'
          });
          continue;
        }

        // Simulate publishing to platforms
        // In real implementation, you would integrate with actual platform APIs
        const postResults = {};
        
        for (const platform of validPlatforms) {
          postResults[platform.platform_name] = {
            success: true,
            published_at: new Date().toISOString(),
            message: `تم النشر بنجاح على ${platform.account_name}`
          };
        }

        // Update post status to published
        await base44.asServiceRole.entities.ScheduledPost.update(post.id, {
          status: 'published',
          published_at: new Date().toISOString(),
          post_results: postResults
        });

        // Update content status if needed
        if (content.status === 'approved') {
          await base44.asServiceRole.entities.Content.update(content.id, {
            status: 'published',
            published_at: new Date().toISOString()
          });
        }

        // Update campaign stats if linked
        if (post.campaign_id) {
          const campaign = await base44.asServiceRole.entities.Campaign.get(post.campaign_id).catch(() => null);
          if (campaign) {
            await base44.asServiceRole.entities.Campaign.update(campaign.id, {
              total_reach: (campaign.total_reach || 0) + 100, // Simulated reach
            });
          }
        }

        results.push({
          post_id: post.id,
          content_title: content.title,
          success: true
        });

      } catch (error) {
        // Mark as failed
        await base44.asServiceRole.entities.ScheduledPost.update(post.id, {
          status: 'failed',
          error_message: error.message
        });

        results.push({
          post_id: post.id,
          success: false,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      results: results
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});