import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import FirecrawlApp from 'npm:@mendable/firecrawl-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Crawling URL:', url);

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

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store crawled data in articles table
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

      // Get active keywords
      const { data: keywords } = await supabaseClient
        .from('keywords')
        .select('id, term')
        .eq('active', true);

      if (keywords) {
        // Check for keyword matches in content
        for (const keyword of keywords) {
          if (
            page.content?.toLowerCase().includes(keyword.term.toLowerCase()) ||
            page.title?.toLowerCase().includes(keyword.term.toLowerCase())
          ) {
            // Create match record
            await supabaseClient
              .from('matches')
              .insert({
                article_id: article.id,
                keyword_id: keyword.id,
              });
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in crawl-website function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});