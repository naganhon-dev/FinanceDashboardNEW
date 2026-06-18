export type RefundStatus = "В работе" | "Вернули" | "Нужна доп инфа";

export interface HistoryRecord {
  timestamp: number;
  author: string;
  description: string;
}

export interface RefundRequest {
  id?: string;
  paymentDate: string; // ISO string
  requestDate?: string; // ISO string
  email: string;
  amount: number;
  txId: string;
  network: string; // ERC-20, TRC-20, BEP-20, etc.
  comment: string;
  status: RefundStatus;
  refundTxId?: string;
  additionalInfoRequired?: string;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  history?: HistoryRecord[];
}
