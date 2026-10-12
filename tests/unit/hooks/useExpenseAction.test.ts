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
    expect(patch).toHaveBeenCalledWith('/api/expense-reports/1', { status: 'approved' });
    expect(state.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: 'error' }));
    expect(fetchData).not.toHaveBeenCalled();
  });

  it('shows an error dialog when the rejection is refused', async () => {
    state.fire.mockResolvedValue({ value: 'Justificatif manquant' });
    vi.mocked(patch).mockRejectedValue(new Error('Erreur 422'));
    const fetchData = vi.fn();

    const { result } = renderHook(() => useExpenseActions(fetchData));
    const outcome = await result.current.handleAction(1, 'rejected');

    expect(outcome).toBe(false);
    expect(patch).toHaveBeenCalledWith('/api/expense-reports/1', {
      status: 'rejected',
      commentaireStatut: 'Justificatif manquant',
    });
    expect(state.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: 'error' }));
    expect(fetchData).not.toHaveBeenCalled();
  });

  it('shows the reason the platform refused the decision with', async () => {
    state.fire.mockResolvedValue({ isConfirmed: true });
    vi.mocked(patch).mockRejectedValue(
      Object.assign(new Error('Cette demande a déjà été traitée.'), { status: 422 })
    );

    const { result } = renderHook(() => useExpenseActions(vi.fn()));
    await result.current.handleAction(202, 'approved');

    expect(state.fire).toHaveBeenLastCalledWith(expect.objectContaining({
      icon: 'error',
      text: 'Une erreur est survenue lors de l\'action sur la note de frais.\n\nCette demande a déjà été traitée.',
    }));
  });

  it.each([
    ['a server error', Object.assign(new Error('Erreur lors de la mise à jour de la note de frais'), { status: 500 })],
    ['a lost session', Object.assign(new Error('Non authentifié'), { status: 401 })],
    ['a network error', new TypeError('Failed to fetch')],
  ])('shows no reason for %s', async (_, error) => {
    state.fire.mockResolvedValue({ isConfirmed: true });
    vi.mocked(patch).mockRejectedValue(error);

    const { result } = renderHook(() => useExpenseActions(vi.fn()));
    await result.current.handleAction(1, 'accounted');

    expect(state.fire).toHaveBeenLastCalledWith(expect.objectContaining({
      icon: 'error',
      text: 'Une erreur est survenue lors de l\'action sur la note de frais.',
    }));
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
