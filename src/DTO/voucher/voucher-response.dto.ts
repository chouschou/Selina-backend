import { Expose, Transform } from 'class-transformer';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

export class VoucherResponseDto {
  @Expose()
  ID: number;

  @Expose()
  Name: string;

  @Expose()
  Description: string;

  @Expose()
  @Transform(({ value }) => formatDate(value))
  StartDate: string;

  @Expose()
  @Transform(({ value }) => formatDate(value))
  EndDate: string;

  @Expose()
  VoucherPercentage: number;

  @Expose()
  MaxDiscountValue: number;

  @Expose()
  MinOrderValue: number;

  @Expose()
  RemainingQuantity: number;
}

function formatDate(value: any): string {
  if (!value) return '';

  // Nếu đã là string đúng định dạng dd/mm/yyyy, không cần xử lý lại
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  const date = dayjs(value);
  if (!date.isValid()) {
    console.warn('Invalid date input:', value);
    return 'Invalid Date';
  }

  return date.format('DD/MM/YYYY'); // KHÔNG dùng .utc().local()
}
