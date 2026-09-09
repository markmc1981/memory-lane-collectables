export const STOCK_STATUSES = [
  "awaiting_intake",
  "awaiting_identification",
  "awaiting_review",
  "ready_to_list",
  "listed",
  "reserved",
  "sold",
  "donated",
  "recycled",
  "disposed",
  "returned",
] as const;

export type StockStatus = (typeof STOCK_STATUSES)[number];
