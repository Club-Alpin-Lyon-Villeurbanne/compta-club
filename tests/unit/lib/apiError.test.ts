import { describe, it, expect } from 'vitest';
import { apiErrorMessage } from '@/app/lib/apiError';

// Réponse de l'API locale (problem+json) à une décision sur une note déjà comptabilisée
const dejaTraitee = {
  type: 'https://tools.ietf.org/html/rfc2616#section-10',
  title: 'An error occurred',
  detail: 'status: Cette note a déjà été traitée.',
  violations: [{ propertyPath: 'status', message: 'Cette note a déjà été traitée.', code: null }],
};

describe('apiErrorMessage', () => {
  it('takes the messages of the violations, without the field name', () => {
    expect(apiErrorMessage(422, dejaTraitee)).toBe('Cette note a déjà été traitée.');
    expect(apiErrorMessage(422, {
      violations: [
        { propertyPath: 'status', message: 'Premier.' },
        { propertyPath: 'commentaireStatut', message: 'Second.' },
      ],
    })).toBe('Premier. Second.');
  });

  it('falls back on detail, then on the JSON-LD description', () => {
    expect(apiErrorMessage(403, { title: 'An error occurred', detail: 'Access Denied.' })).toBe('Access Denied.');
    expect(apiErrorMessage(422, { 'hydra:description': 'status: Refusé.' })).toBe('status: Refusé.');
    expect(apiErrorMessage(422, { description: 'Refusé.' })).toBe('Refusé.');
  });

  it('never reads the trace of an error', () => {
    const notFound = { detail: 'Not Found', trace: [{ file: '/var/www/vendor/api-platform/core/src/State/Provider/ReadProvider.php' }] };

    expect(apiErrorMessage(404, notFound)).toBe('Not Found');
  });

  it('gives nothing for a server error, whose detail may carry SQL', () => {
    expect(apiErrorMessage(500, { detail: 'An exception occurred while executing a query: SQLSTATE[42S22]' })).toBeNull();
  });

  it('gives nothing when the body has no usable message', () => {
    expect(apiErrorMessage(422, {})).toBeNull();
    expect(apiErrorMessage(422, null)).toBeNull();
    expect(apiErrorMessage(422, 'texte')).toBeNull();
    expect(apiErrorMessage(422, { detail: '  ', violations: [{ message: 42 }, null] })).toBeNull();
    expect(apiErrorMessage(401, { code: 401, message: 'Invalid JWT Token' })).toBeNull();
  });
});
