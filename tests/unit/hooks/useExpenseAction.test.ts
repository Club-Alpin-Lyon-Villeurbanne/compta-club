import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const fire = vi.fn();
vi.mock('sweetalert2', () => ({ default: { fire } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/app/lib/fetchClient', () => ({ patch: vi.fn() }));

import { patch } from '@/app/lib/fetchClient';
import { useExpenseActions } from '@/app/lib/hooks/useExpenseAction';

describe('useExpenseActions', () => {
  it('shows an error dialog when the action is refused', async () => {
    fire.mockResolvedValue({ isConfirmed: true });
    vi.mocked(patch).mockRejectedValue(new Error('Erreur 422'));
    const fetchData = vi.fn();

    const { result } = renderHook(() => useExpenseActions(fetchData));
    const outcome = await result.current.handleAction(1, 'approved');

    expect(outcome).toBe(false);
    expect(fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: 'error' }));
    expect(fetchData).not.toHaveBeenCalled();
  });
});
