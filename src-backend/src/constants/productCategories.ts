export const PRODUCT_CATEGORIES = [
  "BULB",
  "TUBE_LIGHT",
  "SWITCH",
  "SOCKET",
  "PLUG",
  "WIRE",
  "CABLE",
  "MCB",
  "BREAKER",
  "DB_BOX",
  "FAN",
  "HOLDER",
  "ADAPTER",
  "EXTENSION_BOARD",
  "DIMMER",
  "SENSOR",
  "CHARGER",
  "INVERTER",
  "BATTERY",
  "OTHER",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
