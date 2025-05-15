import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDeliveryDto } from './create-account-delivery.dto';

export class UpdateAccountDeliveryDto extends PartialType(
  CreateAccountDeliveryDto,
) {}
