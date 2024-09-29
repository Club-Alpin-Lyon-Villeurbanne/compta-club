export const config = {
    TAUX_KILOMETRIQUE_VOITURE: 0.2,
    TAUX_KILOMETRIQUE_MINIBUS: 0.3,
    NUITEE_MAX_REMBOURSABLE: 60,
    DIVISION_PEAGE: 3
  } as const;
  
  export type Config = typeof config;