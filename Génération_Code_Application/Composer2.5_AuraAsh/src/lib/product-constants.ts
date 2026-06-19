import type { ProductItem } from "@/types";

export const categoryLabels: Record<ProductItem["category"], string> = {
  CANDLES: "Candle",
  INCENSE_HOLDERS: "Incense Holder",
  DIFFUSERS: "Diffuser",
};

export const categoryAccents: Record<ProductItem["category"], string> = {
  CANDLES: "from-ember/25 to-ember/5",
  INCENSE_HOLDERS: "from-stone/30 to-stone/5",
  DIFFUSERS: "from-sage/30 to-sage/5",
};
