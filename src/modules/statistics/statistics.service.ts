import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Glass } from 'src/entities/glass.entity';
import { GlassColor } from 'src/entities/glass_color.entity';
import { Order } from 'src/entities/order.entity';
import { OrderDetail } from 'src/entities/order_detail.entity';
import { OrderStatus } from 'src/entities/order_status.entity';
import { Repository } from 'typeorm';

type StatisticsResult = Record<string, number>;
@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderDetail) private detailRepo: Repository<OrderDetail>,
    @InjectRepository(GlassColor) private colorRepo: Repository<GlassColor>,
    @InjectRepository(Glass) private glassRepo: Repository<Glass>,
    @InjectRepository(OrderStatus) private statusRepo: Repository<OrderStatus>,
  ) {}

  private async getCompletedOrderIdsByTime(
    statisticsBy: string,
    time: string,
  ): Promise<number[]> {
    let qb = this.statusRepo
      .createQueryBuilder('status')
      .select('status.Order_ID', 'orderId')
      .where('status.Status = :status', { status: 'completed' });

    if (statisticsBy === 'month') {
      const [month, year] = time.split('/').map(Number);
      qb = qb
        .andWhere('EXTRACT(MONTH FROM status.CreateAt) = :month', { month })
        .andWhere('EXTRACT(YEAR FROM status.CreateAt) = :year', { year });
    } else if (statisticsBy === 'year') {
      const year = Number(time);
      qb = qb.andWhere('EXTRACT(YEAR FROM status.CreateAt) = :year', { year });
    }

    // Kết quả kiểu rõ ràng
    const result: { orderId: number }[] = await qb.getRawMany();

    return result.map((row) => row.orderId);
  }

  async getStatisticsByShape(
    statisticsBy: string,
    time: string,
  ): Promise<StatisticsResult> {
    const orderIds = await this.getCompletedOrderIdsByTime(statisticsBy, time);
    if (!orderIds.length) return {};

    // Kết quả kiểu rõ ràng
    const rows: { shape: string; total: string }[] = await this.detailRepo
      .createQueryBuilder('detail')
      .innerJoin('detail.Order', 'order')
      .innerJoin('detail.GlassColor', 'color')
      .innerJoin('color.Glass', 'glass')
      .select('glass.Shape', 'shape')
      .addSelect('SUM(detail.Quantity)', 'total')
      .where('order.ID IN (:...orderIds)', { orderIds })
      .groupBy('glass.Shape')
      .getRawMany();

    // Chuyển total từ string sang number, trả về Record<string, number>
    return Object.fromEntries(
      rows.map((r) => [r.shape, Number(r.total)]),
    ) as StatisticsResult;
  }

  async getStatisticsByMaterial(
    statisticsBy: string,
    time: string,
  ): Promise<StatisticsResult> {
    const orderIds = await this.getCompletedOrderIdsByTime(statisticsBy, time);
    if (!orderIds.length) return {};

    const rows: { material: string; total: string }[] = await this.detailRepo
      .createQueryBuilder('detail')
      .innerJoin('detail.Order', 'order')
      .innerJoin('detail.GlassColor', 'color')
      .innerJoin('color.Glass', 'glass')
      .select('glass.Material', 'material')
      .addSelect('SUM(detail.Quantity)', 'total')
      .where('order.ID IN (:...orderIds)', { orderIds })
      .groupBy('glass.Material')
      .getRawMany();

    return Object.fromEntries(
      rows.map((r) => [r.material, Number(r.total)]),
    ) as StatisticsResult;
  }

  async getStatisticsByAge(
    statisticsBy: string,
    time: string,
  ): Promise<StatisticsResult> {
    const orderIds = await this.getCompletedOrderIdsByTime(statisticsBy, time);
    if (!orderIds.length) return {};

    const rows: { age: string; total: string }[] = await this.detailRepo
      .createQueryBuilder('detail')
      .innerJoin('detail.Order', 'order')
      .innerJoin('detail.GlassColor', 'color')
      .innerJoin('color.Glass', 'glass')
      .select('glass.Age', 'age')
      .addSelect('SUM(detail.Quantity)', 'total')
      .where('order.ID IN (:...orderIds)', { orderIds })
      .groupBy('glass.Age')
      .getRawMany();

    return Object.fromEntries(
      rows.map((r) => [r.age, Number(r.total)]),
    ) as StatisticsResult;
  }

  async getStatisticsByPrice(statisticsBy: string, time: string) {
    const orderIds = await this.getCompletedOrderIdsByTime(statisticsBy, time);
    if (!orderIds.length) return {};

    const rows = await this.detailRepo
      .createQueryBuilder('detail')
      .innerJoin('detail.Order', 'order')
      .innerJoin('detail.GlassColor', 'color')
      .select('color.Price', 'price')
      .addSelect('SUM(detail.Quantity)', 'total')
      .where('order.ID IN (:...orderIds)', { orderIds })
      .groupBy('color.Price')
      .getRawMany();

    const priceRanges = {
      '0-300.000': 0,
      '300.000-700.000': 0,
      '700.000-1 triệu': 0,
      'Trên 1 triệu': 0,
    };

    for (const row of rows) {
      const price = parseFloat(row.price);
      const quantity = parseInt(row.total);

      if (price <= 300000) priceRanges['0-300.000'] += quantity;
      else if (price <= 700000) priceRanges['300.000-700.000'] += quantity;
      else if (price <= 1000000) priceRanges['700.000-1 triệu'] += quantity;
      else priceRanges['Trên 1 triệu'] += quantity;
    }

    return priceRanges;
  }

  // Hàm lấy danh sách orderId hoàn thành kèm tháng hoàn thành (chỉ dùng cho thống kê theo năm)
  private async getCompletedOrderIdsWithMonth(
    year: number,
  ): Promise<{ orderId: number; month: number }[]> {
    return await this.statusRepo
      .createQueryBuilder('status')
      .select('status.Order_ID', 'orderId')
      .addSelect('EXTRACT(MONTH FROM status.CreateAt)', 'month')
      .where('status.Status = :status', { status: 'completed' })
      .andWhere('EXTRACT(YEAR FROM status.CreateAt) = :year', { year })
      .getRawMany();
  }

  async getStatisticsByType(
    statisticsBy: string,
    time?: string,
  ): Promise<Record<string, number> | Record<string, Record<number, number>>> {
    const typeMapping: Record<string, string> = {
      frame: 'Gọng kính',
      sunglass: 'Kính mát',
    };

    if (statisticsBy === 'month' || statisticsBy === 'all') {
      const orderIds = await this.getCompletedOrderIdsByTime(
        statisticsBy,
        time || '',
      );
      if (!orderIds.length) return {};

      const rows: { type: string; total: string }[] = await this.detailRepo
        .createQueryBuilder('detail')
        .innerJoin('detail.Order', 'order')
        .innerJoin('detail.GlassColor', 'color')
        .innerJoin('color.Glass', 'glass')
        .select('glass.Category', 'type')
        .addSelect('SUM(detail.Quantity)', 'total')
        .where('order.ID IN (:...orderIds)', { orderIds })
        .groupBy('glass.Category')
        .getRawMany();

      return Object.fromEntries(
        rows.map((r) => [typeMapping[r.type] || r.type, Number(r.total)]),
      );
    } else if (statisticsBy === 'year' && time) {
      const year = Number(time);

      const orderStatusRows = await this.statusRepo
        .createQueryBuilder('status')
        .select('status.Order_ID', 'orderId')
        .addSelect('EXTRACT(MONTH FROM status.CreateAt)', 'month')
        .where('status.Status = :status', { status: 'completed' })
        .andWhere('EXTRACT(YEAR FROM status.CreateAt) = :year', { year })
        .getRawMany();

      if (!orderStatusRows.length) return {};

      const monthOrderMap = new Map<number, number[]>();
      for (const row of orderStatusRows) {
        const month = row.month;
        if (!monthOrderMap.has(month)) monthOrderMap.set(month, []);
        monthOrderMap.get(month)!.push(row.orderId);
      }

      const result: Record<string, Record<number, number>> = {};

      for (const [month, orderIds] of monthOrderMap.entries()) {
        if (!orderIds.length) continue;

        const rows: { type: string; total: string }[] = await this.detailRepo
          .createQueryBuilder('detail')
          .innerJoin('detail.Order', 'order')
          .innerJoin('detail.GlassColor', 'color')
          .innerJoin('color.Glass', 'glass')
          .select('glass.Category', 'type')
          .addSelect('SUM(detail.Quantity)', 'total')
          .where('order.ID IN (:...orderIds)', { orderIds })
          .groupBy('glass.Category')
          .getRawMany();

        for (const r of rows) {
          const name = typeMapping[r.type] || r.type;
          const total = Number(r.total);

          if (!result[name]) {
            result[name] = Object.fromEntries(
              Array.from({ length: 12 }, (_, i) => [i + 1, 0]),
            );
          }
          result[name][month] += total;
        }
      }

      return result;
    }

    return {};
  }

  async getRevenueStatistics(
    statisticsBy: 'year' | 'all',
    time: string,
  ): Promise<Record<string, number>> {
    const qb = this.statusRepo
      .createQueryBuilder('status')
      .innerJoin(Order, 'order', 'status.Order_ID = order.ID')
      .select([])
      .where('status.Status = :status', { status: 'completed' });

    if (statisticsBy === 'year') {
      const year = Number(time);
      qb.addSelect('EXTRACT(MONTH FROM status.CreateAt)', 'month')
        .addSelect('SUM(order.Total)', 'revenue')
        .andWhere('EXTRACT(YEAR FROM status.CreateAt) = :year', { year })
        .groupBy('month');
    } else if (statisticsBy === 'all') {
      qb.addSelect('EXTRACT(YEAR FROM status.CreateAt)', 'year')
        .addSelect('SUM(order.Total)', 'revenue')
        .groupBy('year');
    } else {
      throw new BadRequestException('Invalid statisticsBy value');
    }

    const rows = await qb.getRawMany();

    const result: Record<string, number> = {};
    for (const row of rows) {
      const key =
        statisticsBy === 'year' ? String(row.month) : String(row.year);
      result[key] = Number(row.revenue);
    }

    return result;
  }
}
