export class CreateVoucherDto {
  Name: string;
  Description: string;
  StartDate: Date;
  EndDate: Date;
  VoucherPercentage: number;
  MaxDiscountValue: number;
  MinOrderValue: number;
  RemainingQuantity: number;
}
