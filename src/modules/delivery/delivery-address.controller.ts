import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { DeliveryAddressService } from './delivery-address.service';
import { CreateDeliveryAddressDto } from 'src/DTO/delivery/create-delivery-address.dto';
import { UpdateDeliveryAddressDto } from 'src/DTO/delivery/update-delivery-address.dto';

@Controller('delivery-addresses')
export class DeliveryAddressController {
  constructor(
    private readonly deliveryAddressService: DeliveryAddressService,
  ) {}

  @Post()
  create(@Body() dto: CreateDeliveryAddressDto) {
    return this.deliveryAddressService.create(dto);
  }

  @Get()
  findAll() {
    return this.deliveryAddressService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.deliveryAddressService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateDeliveryAddressDto) {
    return this.deliveryAddressService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.deliveryAddressService.remove(id);
  }
}
