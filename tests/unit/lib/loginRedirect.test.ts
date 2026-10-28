import { describe, it, expect } from 'vitest';
import { loginUrl, safeReturnPath } from '@/app/lib/loginRedirect';

describe('safeReturnPath', () => {
  it.each(['/note-de-frais/note/202', '/note-de-frais/101', '/note-de-frais?statut=approved'])(
    'keeps a page of the expense reports: %s',
    (path) => {
      expect(safeReturnPath(path)).toBe(path);
    }
  );

  it.each([
    ['/note-de-frais/./note/../101', '/note-de-frais/101'],
    ['/note-de-frais/note 202', '/note-de-frais/note%20202'],
    ['/note-de-frais/%2F%2Fevil.example', '/note-de-frais/%2F%2Fevil.example'],
    ['/note-de-frais?retour=//evil#//evil', '/note-de-frais?retour=//evil#//evil'],
  ])('returns the normalised form of %s', (path, normalised) => {
    expect(safeReturnPath(path)).toBe(normalised);
  });

  it.each([
    ['another site, without scheme', '//evil.example'],
    ['another site, behind a backslash', '/\\evil.example'],
    ['a backslash further on', '/note-de-frais\\..\\evil'],
    ['a tab the browser drops', '/\t/evil.example'],
    ['a line feed the browser drops', '/\n/evil.example'],
    ['a carriage return', '/\r/evil.example'],
    ['a delete character', '/\u007f/evil.example'],
    ['a dot segment that resolves to another site', '/..//evil.example'],
    ['a single dot that resolves to another site', '/.//evil.example'],
    ['an encoded dot segment', '/%2e%2e//evil.example'],
    ['a dot segment further on', '/note-de-frais/..//evil.example'],
    ['a scheme', 'https://evil.example/note-de-frais'],
    ['a route of the API', '/api/expense-reports'],
    ['encoded slashes', '/%2F%2Fevil.example'],
    ['a public page', '/aide'],
    ['a look-alike prefix', '/note-de-frais-pirate'],
    ['a dot segment out of the expense reports', '/note-de-frais/../api/auth/check'],
    ['javascript', 'javascript:alert(1)'],
    ['a relative path', 'note-de-frais'],
    ['nothing', ''],
  ])('refuses %s', (_, value) => {
    expect(safeReturnPath(value)).toBeNull();
  });

  it('refuses what is not a single string', () => {
    expect(safeReturnPath(undefined)).toBeNull();
    expect(safeReturnPath(['/note-de-frais/note/202'])).toBeNull();
    expect(safeReturnPath(42)).toBeNull();
  });
});

describe('loginUrl', () => {
  it('says that the session expired, and where to come back', () => {
    expect(loginUrl({ expired: true, returnTo: '/note-de-frais/note/202' }))
      .toBe('/?session=expiree&retour=%2Fnote-de-frais%2Fnote%2F202');
  });

  it('leaves out the list, where the login leads anyway', () => {
    expect(loginUrl({ returnTo: '/note-de-frais' })).toBe('/');
    expect(loginUrl({ expired: true, returnTo: '/note-de-frais' })).toBe('/?session=expiree');
  });

  it('drops a page outside compta-club', () => {
    expect(loginUrl({ returnTo: '//evil.example' })).toBe('/');
    expect(loginUrl({ returnTo: null })).toBe('/');
  });
});
