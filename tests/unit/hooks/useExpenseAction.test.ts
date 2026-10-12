import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

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
      Object.assign(new Error('Cette note a déjà été traitée.'), { status: 422 })
    );

    const { result } = renderHook(() => useExpenseActions(vi.fn()));
    await result.current.handleAction(202, 'approved');

    expect(state.fire).toHaveBeenLastCalledWith(expect.objectContaining({
      icon: 'error',
      text: 'Une erreur est survenue lors de l\'action sur la note de frais.\n\nCette note a déjà été traitée.',
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

  it('sends one action at a time: a second click during the sending does nothing', async () => {
    state.fire.mockResolvedValue({ isConfirmed: true });
    let respond: (value: unknown) => void = () => {};
    vi.mocked(patch).mockReturnValue(new Promise((resolve) => { respond = resolve; }));
    const fetchData = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useExpenseActions(fetchData));

    let first: Promise<boolean> = Promise.resolve(false);
    act(() => { first = result.current.handleAction(202, 'approved'); });
    await waitFor(() => expect(result.current.pendingAction).toBe('approved'));

    let second = true;
    await act(async () => { second = await result.current.handleAction(202, 'approved'); });
    expect(second).toBe(false);
    expect(state.fire).toHaveBeenCalledTimes(1);
    expect(patch).toHaveBeenCalledTimes(1);

    await act(async () => { respond({}); expect(await first).toBe(true); });
    expect(result.current.pendingAction).toBeNull();
    expect(fetchData).toHaveBeenCalledOnce();
  });

  it('accepts a new action once the previous one is over', async () => {
    state.fire.mockResolvedValueOnce({ isConfirmed: false }).mockResolvedValue({ isConfirmed: true });
    vi.mocked(patch).mockResolvedValue({});
    const { result } = renderHook(() => useExpenseActions(vi.fn().mockResolvedValue(undefined)));

    await act(async () => { expect(await result.current.handleAction(204, 'accounted')).toBe(false); });
    await act(async () => { expect(await result.current.handleAction(204, 'accounted')).toBe(true); });
    expect(patch).toHaveBeenCalledTimes(1);
  });

  describe('on the page of a note, which reads the note again', () => {
    const alreadyProcessed = (text: string) => ({ title: 'Note déjà traitée', text, icon: 'info' });

    it('confirms an action only once the note shows it', async () => {
      state.fire.mockResolvedValue({ isConfirmed: true });
      vi.mocked(patch).mockResolvedValue({});
      const fetchData = vi.fn();
      const reloadStatus = vi.fn().mockResolvedValueOnce('preapproved').mockResolvedValueOnce('approved');
      const { result } = renderHook(() => useExpenseActions(fetchData, { reloadStatus }));

      let outcome = false;
      await act(async () => { outcome = await result.current.handleAction(202, 'approved', 'preapproved'); });

      expect(outcome).toBe(true);
      expect(reloadStatus).toHaveBeenCalledTimes(2);
      expect(fetchData).not.toHaveBeenCalled();
      expect(state.fire).toHaveBeenCalledTimes(1);
    });

    it('sends nothing when the note was processed elsewhere during the confirmation', async () => {
      state.fire.mockResolvedValue({ isConfirmed: true });
      const reloadStatus = vi.fn().mockResolvedValue('accounted');
      const { result } = renderHook(() => useExpenseActions(vi.fn(), { reloadStatus }));

      let outcome = true;
      await act(async () => { outcome = await result.current.handleAction(204, 'accounted', 'approved'); });

      expect(outcome).toBe(false);
      expect(patch).not.toHaveBeenCalled();
      expect(state.fire).toHaveBeenLastCalledWith(alreadyProcessed(
        'Elle a été traitée entre-temps. Elle est maintenant : comptabilisée. Votre action n\'a pas été enregistrée.'
      ));
    });

    it('does not confirm an action the API accepted without effect', async () => {
      state.fire.mockResolvedValue({ isConfirmed: true });
      vi.mocked(patch).mockResolvedValue({});
      const reloadStatus = vi.fn().mockResolvedValueOnce('approved').mockResolvedValueOnce('approved');
      const { result } = renderHook(() => useExpenseActions(vi.fn(), { reloadStatus }));

      let outcome = true;
      await act(async () => { outcome = await result.current.handleAction(204, 'accounted', 'approved'); });

      expect(outcome).toBe(false);
      expect(state.fire).toHaveBeenLastCalledWith(alreadyProcessed(
        'Elle a été traitée entre-temps. Elle est maintenant : approuvée. Votre action n\'a pas été enregistrée.'
      ));
    });

    it.each([
      ['approved', 'Votre action n\'a pas été enregistrée.'],
      ['rejected', 'Votre refus n\'a pas été envoyé.'],
    ] as const)('tells, without an error, that the note was processed in between (%s)', async (action, lost) => {
      state.fire.mockResolvedValue({ isConfirmed: true, value: 'Il manque la facture.' });
      vi.mocked(patch).mockRejectedValue(Object.assign(new Error('Cette note a déjà été traitée.'), { status: 422 }));
      const reloadStatus = vi.fn().mockResolvedValueOnce('preapproved').mockResolvedValueOnce('approved');
      const { result } = renderHook(() => useExpenseActions(vi.fn(), { reloadStatus }));

      let outcome = true;
      await act(async () => { outcome = await result.current.handleAction(202, action, 'preapproved'); });

      expect(outcome).toBe(false);
      expect(reloadStatus).toHaveBeenCalledTimes(2);
      expect(state.fire).toHaveBeenLastCalledWith(alreadyProcessed(
        `Elle a été traitée entre-temps. Elle est maintenant : approuvée. ${lost}`
      ));
    });

    it('reads the note again after any other refusal of the API, and shows it', async () => {
      state.fire.mockResolvedValue({ isConfirmed: true });
      vi.mocked(patch).mockRejectedValue(Object.assign(new Error('Accès refusé.'), { status: 403 }));
      const reloadStatus = vi.fn().mockResolvedValue('preapproved');
      const { result } = renderHook(() => useExpenseActions(vi.fn(), { reloadStatus }));

      await act(async () => { await result.current.handleAction(202, 'approved', 'preapproved'); });

      expect(reloadStatus).toHaveBeenCalledTimes(2);
      expect(state.fire).toHaveBeenLastCalledWith(expect.objectContaining({
        icon: 'error',
        text: 'Une erreur est survenue lors de l\'action sur la note de frais.\n\nAccès refusé.',
      }));
    });

    it('reads nothing when the confirmation is cancelled', async () => {
      state.fire.mockResolvedValue({ isConfirmed: false });
      const reloadStatus = vi.fn();
      const { result } = renderHook(() => useExpenseActions(vi.fn(), { reloadStatus }));

      await act(async () => { await result.current.handleAction(202, 'approved', 'preapproved'); });

      expect(reloadStatus).not.toHaveBeenCalled();
      expect(patch).not.toHaveBeenCalled();
    });
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
