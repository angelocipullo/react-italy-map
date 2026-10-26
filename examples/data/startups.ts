// Example data for the demo. Values are approximate.

export interface Startup { name: string; region: string; sector: string; year: number }

export const STARTUPS: Startup[] = [
  { name: 'Satispay', region: 'Lombardia', sector: 'Fintech', year: 2013 },
  { name: 'Scalapay', region: 'Lombardia', sector: 'Fintech', year: 2019 },
  { name: 'Casavo', region: 'Lombardia', sector: 'PropTech', year: 2017 },
  { name: 'Bending Spoons', region: 'Lombardia', sector: 'Apps', year: 2013 },
  { name: 'Prima Assicurazioni', region: 'Lombardia', sector: 'InsurTech', year: 2015 },
  { name: 'D-Orbit', region: 'Lombardia', sector: 'SpaceTech', year: 2011 },
  { name: 'Cortilia', region: 'Lombardia', sector: 'FoodTech', year: 2012 },
  { name: 'Moneyfarm', region: 'Lombardia', sector: 'Fintech', year: 2011 },
  { name: 'Musixmatch', region: 'Emilia-Romagna', sector: 'MusicTech', year: 2010 },
  { name: 'Subito.it', region: 'Lazio', sector: 'Marketplace', year: 2007 },
  { name: 'Facile.it', region: 'Lazio', sector: 'Fintech', year: 2008 },
  { name: 'Flowe', region: 'Lazio', sector: 'Fintech', year: 2020 },
  { name: 'Doctolib', region: 'Lazio', sector: 'HealthTech', year: 2013 },
  { name: 'Soldo', region: 'Lazio', sector: 'Fintech', year: 2015 },
  { name: 'Exein', region: 'Lazio', sector: 'CyberSec', year: 2018 },
  { name: 'Iubenda', region: 'Toscana', sector: 'LegalTech', year: 2011 },
  { name: 'Bugseng', region: 'Toscana', sector: 'CyberSec', year: 2018 },
  { name: 'Credimi', region: 'Lombardia', sector: 'Fintech', year: 2016 },
  { name: 'Tannico', region: 'Lombardia', sector: 'E-commerce', year: 2010 },
  { name: 'Talent Garden', region: 'Lombardia', sector: 'CoWorking', year: 2011 },
];

export const countByRegion = STARTUPS.reduce<Record<string, number>>((acc, s) => {
  acc[s.region] = (acc[s.region] ?? 0) + 1;
  return acc;
}, {});
