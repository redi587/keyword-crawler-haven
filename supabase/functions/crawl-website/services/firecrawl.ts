import FirecrawlApp from 'npm:@mendable/firecrawl-js';

interface CrawlOptions {
  url: string;
  isScheduled?: boolean;
}

export class FirecrawlService {
  private firecrawl: any;

  constructor(apiKey: string) {
    console.log('[FirecrawlService] Initializing with API key');
    this.firecrawl = new FirecrawlApp({ apiKey });
  }

  async crawlUrl({ url }: CrawlOptions) {
    console.log('[FirecrawlService] Starting crawl for URL:', url);
    
    try {
      const response = await this.firecrawl.crawlUrl(url, {
        scrapeOptions: {
          formats: ['markdown', 'html'],
          selectors: {
            title: 'h1, title',
            content: 'article, main, .content, .article-content',
          },
        },
      });

      if (!response.success) {
        console.error('[FirecrawlService] Crawl failed:', response.error);
        throw new Error(response.error || 'Failed to crawl website');
      }

      console.log('[FirecrawlService] Successfully crawled URL:', url, 'Pages found:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('[FirecrawlService] Error during crawl:', error);
      throw error;
    }
  }
}