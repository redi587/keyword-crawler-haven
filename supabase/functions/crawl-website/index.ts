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
    console.log('Crawling URL:', url, 'Scheduled:', isScheduled);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (isScheduled) {
      const { data: config } = await supabaseClient
        .from('crawler_configs')
        .select('*')
        .eq('url', url)
        .single();

      if (!config || !config.active) {
        console.log('Skipping inactive configuration');
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
        
        console.log('Current time:', currentTime, 'Start:', startMinutes, 'End:', endMinutes);
        
        if (currentTime < startMinutes || currentTime > endMinutes) {
          console.log('Outside of scheduled crawling hours');
          return new Response(
            JSON.stringify({ message: 'Outside of scheduled crawling hours' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not found');
    }

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
    
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
      throw new Error(crawlResponse.error || 'Failed to crawl website');
    }

    // Get active keywords for matching
    const { data: keywords } = await supabaseClient
      .from('keywords')
      .select('id, term')
      .eq('active', true);

    // Get active email configurations
    const { data: emailConfigs } = await supabaseClient
      .from('email_configs')
      .select('email')
      .eq('active', true);

    const matchedArticles = [];

    // Store crawled data and check for matches
    for (const page of crawlResponse.data) {
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
        console.error('Error inserting article:', insertError);
        continue;
      }

      if (keywords) {
        const matches = [];
        for (const keyword of keywords) {
          if (
            page.content?.toLowerCase().includes(keyword.term.toLowerCase()) ||
            page.title?.toLowerCase().includes(keyword.term.toLowerCase())
          ) {
            matches.push(keyword);
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

    // Send email notifications if there are matches
    if (matchedArticles.length > 0 && emailConfigs?.length > 0) {
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

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in crawl-website function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});