import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const state = vi.hoisted(() => ({ failLoad: false, fire: vi.fn() }));
vi.mock('sweetalert2', () => ({
  get default() {
    if (state.failLoad) throw new Error('ChunkLoadError');
    return { fire: state.fire };
  },
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/app/lib/fetchClient', () => ({ patch: vi.fn() }));

import { patch } from '@/app/lib/fetchClient';
import { useExpenseActions } from '@/app/lib/hooks/useExpenseAction';

describe('useExpenseActions', () => {
  beforeEach(() => {
    state.failLoad = false;
    vi.clearAllMocks();
  });

  it('shows an error dialog when the action is refused', async () => {
    state.fire.mockResolvedValue({ isConfirmed: true });
    vi.mocked(patch).mockRejectedValue(new Error('Erreur 422'));
    const fetchData = vi.fn();

    const { result } = renderHook(() => useExpenseActions(fetchData));
    const outcome = await result.current.handleAction(1, 'approved');

    expect(outcome).toBe(false);
    expect(state.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: 'error' }));
    expect(fetchData).not.toHaveBeenCalled();
  });

  it('falls back to an alert when the dialog library cannot be loaded', async () => {
    state.failLoad = true;
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useExpenseActions(vi.fn()));
    const outcome = await result.current.handleAction(1, 'approved');

    expect(outcome).toBe(false);
    expect(alert).toHaveBeenCalledOnce();
    expect(patch).not.toHaveBeenCalled();
  });
});
