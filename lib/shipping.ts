const SHIPPING_BY_COMMUNE: Record<string, number> = {
  cocody: 2000,
  yopougon: 2500,
  plateau: 1500,
  adjame: 2000,
  abobo: 2500,
  treichville: 2000,
  marcory: 2000,
  koumassi: 2200,
  portbouet: 2500,
  "port-bouet": 2500,
  bingerville: 3000,
  anyama: 3000,
  songon: 3500,
};

const DEFAULT_SHIPPING_FEE = 3000;

export const SHIPPING_COMMUNES: Array<{ label: string; value: string; fee: number }> = [
  { label: "Plateau", value: "plateau", fee: 1500 },
  { label: "Adjame", value: "adjame", fee: 2000 },
  { label: "Cocody", value: "cocody", fee: 2000 },
  { label: "Marcory", value: "marcory", fee: 2000 },
  { label: "Treichville", value: "treichville", fee: 2000 },
  { label: "Koumassi", value: "koumassi", fee: 2200 },
  { label: "Abobo", value: "abobo", fee: 2500 },
  { label: "Yopougon", value: "yopougon", fee: 2500 },
  { label: "Port-Bouet", value: "port-bouet", fee: 2500 },
  { label: "Anyama", value: "anyama", fee: 3000 },
  { label: "Bingerville", value: "bingerville", fee: 3000 },
  { label: "Songon", value: "songon", fee: 3500 },
];

function normalizeCommune(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

export function getShippingFeeByCommune(commune: string): number {
  const normalized = normalizeCommune(commune);
  if (!normalized) {
    return DEFAULT_SHIPPING_FEE;
  }
  return SHIPPING_BY_COMMUNE[normalized] ?? DEFAULT_SHIPPING_FEE;
}

