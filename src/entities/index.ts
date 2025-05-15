import { Account } from './account.entity';
import { AccountDelivery } from './account_delivery.entity';
import { AccountVoucher } from './account_voucher.entity';
import { Conservation } from './conservation.entity';
import { Customer } from './customer.entity';
import { DeliveryAddress } from './delivery_address.entity';
import { Glass } from './glass.entity';
import { GlassColor } from './glass_color.entity';
import { Image } from './image.entity';
import { Message } from './message.entity';
import { Order } from './order.entity';
import { OrderDetail } from './order_detail.entity';
import { OrderStatus } from './order_status.entity';
import { Permission } from './permission.entity';
import { Rating } from './rating.entity';
import { Role } from './role.entity';
import { RolePermission } from './role_permission.entity';
import { ShippingFee } from './shipping_fee.entity';
import { Store } from './store.entity';
import { Voucher } from './voucher.entity';

export const entities = [
  Account,
  AccountDelivery,
  AccountVoucher,
  Conservation,
  Customer,
  DeliveryAddress,
  Glass,
  GlassColor,
  Image,
  Message,
  Order,
  OrderDetail,
  OrderStatus,
  Permission,
  Rating,
  Role,
  RolePermission,
  ShippingFee,
  Store,
  Voucher,
];
