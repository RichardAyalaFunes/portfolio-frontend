export interface VariantEntry {
  urlNumber: number;
  folder: string;
  name: string;
  enabled: boolean;
}

export const variantConfig = {
  defaultVariant: 1,
  variants: [
    { urlNumber: 1, folder: 'v1', name: 'Classic', enabled: true },
    { urlNumber: 2, folder: 'v2', name: 'Storytelling', enabled: false },
  ] satisfies VariantEntry[],
};

export function getVariantByUrl(urlNumber: number): VariantEntry | undefined {
  return variantConfig.variants.find(v => v.urlNumber === urlNumber);
}

export function getNextVariantUrl(currentUrlNumber: number): number {
  const enabled = variantConfig.variants.filter(v => v.enabled);
  const idx = enabled.findIndex(v => v.urlNumber === currentUrlNumber);
  return enabled[(idx + 1) % enabled.length].urlNumber;
}

export function getPrevVariantUrl(currentUrlNumber: number): number {
  const enabled = variantConfig.variants.filter(v => v.enabled);
  const idx = enabled.findIndex(v => v.urlNumber === currentUrlNumber);
  return enabled[(idx - 1 + enabled.length) % enabled.length].urlNumber;
}
