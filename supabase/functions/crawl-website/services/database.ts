import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export class DatabaseService {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    console.log('[DatabaseService] Initializing Supabase client');
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async validateScheduledCrawl(url: string) {
    console.log('[DatabaseService] Checking configuration for scheduled crawl');
    const { data: config, error } = await this.supabase
      .from('crawler_configs')
      .select('*')
      .eq('url', url)
      .single();

    if (error) {
      console.error('[DatabaseService] Error fetching crawler config:', error);
      throw error;
    }

    return config;
  }

  async getActiveKeywords() {
    console.log('[DatabaseService] Fetching active keywords');
    const { data: keywords, error } = await this.supabase
      .from('keywords')
      .select('id, term')
      .eq('active', true);

    if (error) {
      console.error('[DatabaseService] Error fetching keywords:', error);
      throw error;
    }

    return keywords;
  }

  async getActiveEmailConfigs() {
    console.log('[DatabaseService] Fetching active email configurations');
    const { data: emailConfigs, error } = await this.supabase
      .from('email_configs')
      .select('email')
      .eq('active', true);

    if (error) {
      console.error('[DatabaseService] Error fetching email configs:', error);
      throw error;
    }

    return emailConfigs;
  }

  async storeArticle(articleData: any) {
    console.log('[DatabaseService] Storing article:', articleData.title);
    const { data: article, error } = await this.supabase
      .from('articles')
      .insert({
        url: articleData.url,
        title: articleData.title || 'Untitled',
        content: articleData.content,
        source: new URL(articleData.url).hostname,
        crawled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[DatabaseService] Error storing article:', error);
      throw error;
    }

    return article;
  }

  async storeMatch(articleId: number, keywordId: number) {
    console.log('[DatabaseService] Storing match - Article:', articleId, 'Keyword:', keywordId);
    const { error } = await this.supabase
      .from('matches')
      .insert({
        article_id: articleId,
        keyword_id: keywordId,
      });

    if (error) {
      console.error('[DatabaseService] Error storing match:', error);
      throw error;
    }
  }

  async sendEmailNotification(emailConfig: any, matchedArticles: any[]) {
    console.log('[DatabaseService] Sending email notification to:', emailConfig.email);
    try {
      await this.supabase.functions.invoke('send-email', {
        body: {
          to: [emailConfig.email],
          subject: 'New Keyword Matches Found',
          html: this.generateEmailContent(matchedArticles),
        },
      });
    } catch (error) {
      console.error('[DatabaseService] Error sending email notification:', error);
      throw error;
    }
  }

  private generateEmailContent(matchedArticles: any[]) {
    return matchedArticles.map(({ article, matches }) => `
      <h3>${article.title}</h3>
      <p>Source: ${article.source}</p>
      <p>URL: <a href="${article.url}">${article.url}</a></p>
      <p>Matched Keywords: ${matches.join(', ')}</p>
      <p>Content Preview: ${article.content?.substring(0, 200)}...</p>
      <hr>
    `).join('');
  }
}