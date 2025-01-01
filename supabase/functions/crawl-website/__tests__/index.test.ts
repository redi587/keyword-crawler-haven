import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from '@mendable/firecrawl-js';

// Mock Firecrawl
vi.mock('@mendable/firecrawl-js', () => ({
  default: vi.fn().mockImplementation(() => ({
    crawlUrl: vi.fn(),
  })),
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    functions: {
      invoke: vi.fn(),
    },
  })),
}));

describe('crawl-website Edge Function', () => {
  let mockFirecrawl: any;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFirecrawl = new FirecrawlApp({ apiKey: 'test-key' });
    mockSupabase = createClient('test-url', 'test-key');
  });

  it('successfully crawls a valid website', async () => {
    const mockUrl = 'https://example.com';
    const mockCrawlResponse = {
      success: true,
      data: [{
        url: mockUrl,
        title: 'Test Page',
        content: 'Test content with keywords',
      }],
    };

    mockFirecrawl.crawlUrl.mockResolvedValueOnce(mockCrawlResponse);

    const response = await mockSupabase.functions.invoke('crawl-website', {
      body: { url: mockUrl },
    });

    expect(response.status).toBe(200);
    expect(mockFirecrawl.crawlUrl).toHaveBeenCalledWith(mockUrl, expect.any(Object));
  });

  it('handles network timeouts', async () => {
    const mockUrl = 'https://example.com';
    mockFirecrawl.crawlUrl.mockRejectedValueOnce(new Error('Network timeout'));

    const response = await mockSupabase.functions.invoke('crawl-website', {
      body: { url: mockUrl },
    });

    expect(response.status).toBe(500);
    expect(response.error).toContain('Network timeout');
  });

  it('validates URL format', async () => {
    const invalidUrl = 'not-a-url';
    
    const response = await mockSupabase.functions.invoke('crawl-website', {
      body: { url: invalidUrl },
    });

    expect(response.status).toBe(400);
    expect(response.error).toContain('Invalid URL format');
  });

  it('handles rate limiting', async () => {
    const mockUrl = 'https://example.com';
    mockFirecrawl.crawlUrl.mockRejectedValueOnce(new Error('Rate limit exceeded'));

    const response = await mockSupabase.functions.invoke('crawl-website', {
      body: { url: mockUrl },
    });

    expect(response.status).toBe(429);
    expect(response.error).toContain('Rate limit exceeded');
  });
});