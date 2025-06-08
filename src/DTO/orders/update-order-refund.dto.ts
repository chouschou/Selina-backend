export class UpdateOrderRefundDto {
  IDAccountCancelReturn?: number;
  Reason?: string;
  Bank?: string;
  AccountHolder?: string;
  AccountNumber?: string;
  RefundAt?: Date;
}
