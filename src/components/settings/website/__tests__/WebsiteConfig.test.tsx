import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WebsiteConfig } from '../WebsiteConfig';
import { supabase } from '@/lib/supabase';
import { vi } from 'vitest';

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
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
  },
}));

describe('WebsiteConfig Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders website configuration form', () => {
    render(<WebsiteConfig />);
    expect(screen.getByText(/Website Configuration/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter website URL/i)).toBeInTheDocument();
  });

  test('handles website activation/deactivation', async () => {
    const mockConfig = {
      id: 1,
      url: 'https://example.com',
      active: true,
      check_interval: 30,
    };

    (supabase.from().select().single as jest.Mock).mockResolvedValueOnce({
      data: mockConfig,
      error: null,
    });

    render(<WebsiteConfig />);
    
    const toggleButton = screen.getByRole('switch');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(supabase.from().update).toHaveBeenCalledWith({
        active: false,
      });
    });
  });

  test('validates crawl interval input', async () => {
    render(<WebsiteConfig />);
    
    const intervalInput = screen.getByLabelText(/Check Interval/i);
    fireEvent.change(intervalInput, { target: { value: '-5' } });

    expect(screen.getByText(/Interval must be positive/i)).toBeInTheDocument();
  });
});