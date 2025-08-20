export const config = {
    CLUB_NAME: process.env.NEXT_PUBLIC_CLUB_NAME || 'CLUB ALPIN DE LYON',
    TAUX_KILOMETRIQUE_VOITURE: 0.2,
    TAUX_KILOMETRIQUE_MINIBUS: 0.3,
    NUITEE_MAX_REMBOURSABLE: 60,
    DEFAULT_COMMISSION_ICON: 'https://www.clubalpinlyon.fr/ftp/commission/0/picto-dark.png',
    DIVISION_PEAGE: 3
  } as const;
  
  export type Config = typeof config;