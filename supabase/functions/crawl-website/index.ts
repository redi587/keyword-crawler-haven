import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import FirecrawlApp from 'npm:@mendable/firecrawl-js';

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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (isScheduled) {
      console.log('[Crawler] Checking configuration for scheduled crawl');
      const { data: config } = await supabaseClient
        .from('crawler_configs')
        .select('*')
        .eq('url', url)
        .single();

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

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('[Crawler] Firecrawl API key not found');
      throw new Error('Firecrawl API key not found');
    }

    console.log('[Crawler] Initializing Firecrawl client');
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
    
    console.log('[Crawler] Starting crawl request for URL:', url);
    const crawlResponse = await firecrawl.crawlUrl(url, {
      scrapeOptions: {
        formats: ['markdown', 'html'],
        selectors: {
          title: 'h1, title',
          content: 'article, main, .content, .article-content',
        },
      },
    });

    if (!crawlResponse.success) {
      console.error('[Crawler] Crawl failed for URL:', url, 'Error:', crawlResponse.error);
      throw new Error(crawlResponse.error || 'Failed to crawl website');
    }

    console.log('[Crawler] Successfully crawled URL:', url, 'Pages found:', crawlResponse.data.length);

    // Get active keywords for matching
    const { data: keywords } = await supabaseClient
      .from('keywords')
      .select('id, term')
      .eq('active', true);

    console.log('[Crawler] Found active keywords:', keywords?.length || 0);

    // Get active email configurations
    const { data: emailConfigs } = await supabaseClient
      .from('email_configs')
      .select('email')
      .eq('active', true);

    console.log('[Crawler] Found active email configurations:', emailConfigs?.length || 0);

    const matchedArticles = [];

    // Store crawled data and check for matches
    for (const page of crawlResponse.data) {
      console.log('[Crawler] Processing page:', page.url);
      
      const { data: article, error: insertError } = await supabaseClient
        .from('articles')
        .insert({
          url: page.url,
          title: page.title || 'Untitled',
          content: page.content,
          source: new URL(url).hostname,
          crawled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Crawler] Error inserting article:', insertError);
        continue;
      }

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
            
            await supabaseClient
              .from('matches')
              .insert({
                article_id: article.id,
                keyword_id: keyword.id,
              });
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

    // Send email notifications if there are matches
    if (matchedArticles.length > 0 && emailConfigs?.length > 0) {
      console.log('[Crawler] Preparing email notifications');
      
      const emailContent = matchedArticles.map(({ article, matches }) => `
        <h3>${article.title}</h3>
        <p>Source: ${article.source}</p>
        <p>URL: <a href="${article.url}">${article.url}</a></p>
        <p>Matched Keywords: ${matches.join(', ')}</p>
        <p>Content Preview: ${article.content?.substring(0, 200)}...</p>
        <hr>
      `).join('');

      // Call send-email function for each email config
      for (const config of emailConfigs) {
        console.log('[Crawler] Sending email notification to:', config.email);
        
        await supabaseClient.functions.invoke('send-email', {
          body: {
            to: [config.email],
            subject: 'New Keyword Matches Found',
            html: `
              <h2>New Articles Matching Your Keywords</h2>
              ${emailContent}
            `,
          },
        });
      }
    }

    console.log('[Crawler] Crawl completed successfully for URL:', url);
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Crawler] Error in crawl-website function:', error);
    
    // Handle rate limiting errors specifically
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