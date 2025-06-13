// import * as qs from 'qs';
// import * as crypto from 'crypto';
// import { Injectable } from '@nestjs/common';
// import { vnp_Config } from './vnpay.config';

// @Injectable()
// export class VnpayService {
//   createPaymentUrl(orderId: number, amount: number, clientIp: string): string {
//     const createDate = new Date();
//     const vnp_Params: any = {
//       vnp_Version: '2.1.0',
//       vnp_Command: 'pay',
//       vnp_TmnCode: vnp_Config.vnp_TmnCode,
//       vnp_Locale: 'vn',
//       vnp_CurrCode: 'VND',
//       vnp_TxnRef: `${orderId}_${Date.now()}`,
//       vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
//       vnp_OrderType: 'other',
//       vnp_Amount: amount * 100,
//       vnp_ReturnUrl: vnp_Config.vnp_ReturnUrl,
//       vnp_IpAddr: clientIp,
//       vnp_CreateDate: createDate
//         .toISOString()
//         .replace(/[-:TZ]/g, '')
//         .slice(0, 14),
//     };

//     const sortedParams = Object.fromEntries(Object.entries(vnp_Params).sort());
//     const signData = qs.stringify(sortedParams, { encode: false });
//     const secureHash = crypto
//       .createHmac('sha512', vnp_Config.vnp_HashSecret!)
//       .update(signData)
//       .digest('hex');

//     const queryString = qs.stringify(sortedParams, { encode: true });
//     const paymentUrl = `${vnp_Config.vnp_Url}?${queryString}&vnp_SecureHash=${secureHash}`;

//     // ✅ Log sau khi khai báo
//     console.log('======= VNPay Debug =======');
//     console.log('Sign Data:', signData);
//     console.log('Secure Hash:', secureHash);
//     console.log('Final Payment URL:', paymentUrl);

//     return paymentUrl;
//   }
// }

// vnpay.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as qs from 'qs';
import * as moment from 'moment-timezone';

@Injectable()
export class VnpayService {
  constructor(private readonly config: ConfigService) {}

  sortObject(obj: Record<string, string>) {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    }
    return sorted;
  }

  createPaymentUrl(order: any, clientIp: string) {
    const tmnCode = this.config.get<string>('VNP_TMNCODE')!;
    const secretKey = this.config.get<string>('VNP_HASH_SECRET')!;
    const vnpUrl = this.config.get<string>('VNP_URL');
    const returnUrl = this.config.get<string>('VNP_RETURN_URL')!;

    const createDate = moment().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss');
    const expireDate = moment()
      .tz('Asia/Ho_Chi_Minh')
      .add(5, 'minutes')
      .format('YYYYMMDDHHmmss');

    const orderId = order.ID;
    const txnRef = `${orderId}_${Date.now()}`;

    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: (order.Total * 100).toString(),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: clientIp,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    const sortedParams = this.sortObject(vnp_Params);
    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const secureHash = crypto
      .createHmac('sha512', secretKey)
      .update(signData)
      .digest('hex');

    sortedParams['vnp_SecureHashType'] = 'SHA512';
    sortedParams['vnp_SecureHash'] = secureHash;

    const paymentUrl = `${vnpUrl}?${qs.stringify(sortedParams, { encode: false })}`;
    console.log('Sign Data:', signData);
    console.log('Final URL:', paymentUrl);

    return paymentUrl;
  }
}
