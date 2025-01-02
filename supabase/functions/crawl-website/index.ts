import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { FirecrawlService } from "./services/firecrawl.ts";
import { DatabaseService } from "./services/database.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, isScheduled = false } = await req.json();
    console.log('[Crawler] Starting crawl for URL:', url, 'Scheduled:', isScheduled);

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      console.error('[Crawler] Invalid URL format:', url);
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not found');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const db = new DatabaseService(supabaseUrl, supabaseKey);
    const crawler = new FirecrawlService(firecrawlApiKey);

    if (isScheduled) {
      const config = await db.validateScheduledCrawl(url);
      
      if (!config || !config.active) {
        console.log('[Crawler] Skipping inactive configuration for URL:', url);
        return new Response(
          JSON.stringify({ message: 'Configuration inactive' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (config.start_time && config.end_time) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const [startHour, startMinute] = config.start_time.split(':').map(Number);
        const [endHour, endMinute] = config.end_time.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        
        console.log('[Crawler] Time check - Current:', currentTime, 'Start:', startMinutes, 'End:', endMinutes);
        
        if (currentTime < startMinutes || currentTime > endMinutes) {
          console.log('[Crawler] Outside of scheduled crawling hours for URL:', url);
          return new Response(
            JSON.stringify({ message: 'Outside of scheduled crawling hours' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const crawledPages = await crawler.crawlUrl({ url, isScheduled });
    console.log('[Crawler] Successfully crawled pages:', crawledPages.length);

    const keywords = await db.getActiveKeywords();
    console.log('[Crawler] Found active keywords:', keywords?.length || 0);

    const emailConfigs = await db.getActiveEmailConfigs();
    console.log('[Crawler] Found active email configurations:', emailConfigs?.length || 0);

    const matchedArticles = [];

    for (const page of crawledPages) {
      console.log('[Crawler] Processing page:', page.url);
      
      const article = await db.storeArticle(page);
      console.log('[Crawler] Successfully stored article:', article.id);

      if (keywords) {
        const matches = [];
        for (const keyword of keywords) {
          if (
            page.content?.toLowerCase().includes(keyword.term.toLowerCase()) ||
            page.title?.toLowerCase().includes(keyword.term.toLowerCase())
          ) {
            matches.push(keyword);
            console.log('[Crawler] Found keyword match:', keyword.term, 'in article:', article.id);
            await db.storeMatch(article.id, keyword.id);
          }
        }

        if (matches.length > 0) {
          matchedArticles.push({
            article,
            matches: matches.map(k => k.term),
          });
        }
      }
    }

    console.log('[Crawler] Total matched articles:', matchedArticles.length);

    if (matchedArticles.length > 0 && emailConfigs?.length > 0) {
      console.log('[Crawler] Preparing email notifications');
      for (const config of emailConfigs) {
        await db.sendEmailNotification(config, matchedArticles);
      }
    }

    console.log('[Crawler] Crawl completed successfully for URL:', url);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Crawler] Error in crawl-website function:', error);
    
    if (error.message?.includes('rate limit')) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});