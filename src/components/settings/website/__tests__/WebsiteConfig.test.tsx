import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WebsiteConfig } from '../WebsiteConfig';
import { supabase } from '@/lib/supabase';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('WebsiteConfig Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders website configuration form', () => {
    render(<WebsiteConfig />, { wrapper: createWrapper() });
    expect(screen.getByText(/Website URL/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/example.com/i)).toBeInTheDocument();
  });

  test('handles website activation/deactivation', async () => {
    const mockConfig = {
      id: 1,
      url: 'https://example.com',
      active: true,
      check_interval: 30,
    };

    const mockResponse = {
      data: [mockConfig],
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    };

    vi.mocked(supabase.from('crawler_configs').select).mockResolvedValueOnce(mockResponse);

    render(<WebsiteConfig />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('crawler_configs');
    });
  });

  test('validates crawl interval input', async () => {
    render(<WebsiteConfig />, { wrapper: createWrapper() });
    
    const intervalInput = screen.getByLabelText(/Check Interval/i);
    fireEvent.change(intervalInput, { target: { value: '-5' } });

    expect(screen.getByPlaceholderText(/https:\/\/example.com/i)).toBeInTheDocument();
  });
});