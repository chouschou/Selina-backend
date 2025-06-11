import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
  ParseIntPipe,
  Put,
  Delete,
} from '@nestjs/common';
import { AccountDeliveryService } from './account-delivery.service';
import { CreateAccountDeliveryDto } from 'src/DTO/account-delivery/create-account-delivery.dto';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('account-delivery')
export class AccountDeliveryController {
  constructor(
    private readonly accountDeliveryService: AccountDeliveryService,
  ) {}

  @Get(':id/check-used-in-order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  checkUsedInOrder(@Param('id', ParseIntPipe) id: number) {
    return this.accountDeliveryService.isUsedInOrder(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  create(@Req() req: any, @Body() dto: CreateAccountDeliveryDto) {
    const accountId = req.user.userId; // Lấy AccountID từ JWT
    console.log('req.user ===', req.user);
    return this.accountDeliveryService.create(accountId, dto);
  }
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAccountDeliveryDto,
  ) {
    const accountId = req.user.userId;
    return this.accountDeliveryService.update(accountId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  delete(@Req() req: any, @Param('id') id: number) {
    const accountId = req.user.userId;
    return this.accountDeliveryService.delete(accountId, id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'customer', 'employee')
  findAll() {
    return this.accountDeliveryService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'customer', 'employee')
  async findOne(@Req() req, @Param('id') id: number) {
    const user = req.user;

    const accountDelivery = await this.accountDeliveryService.findOne(id);

    if (!accountDelivery) {
      throw new NotFoundException('Không tìm thấy bản ghi Account_Delivery');
    }

    console.log('user ====', user);

    if (
      user.role === 'customer' &&
      accountDelivery.Account.ID !== user.userId
    ) {
      throw new ForbiddenException('Bạn không được phép truy cập dữ liệu này');
    }

    return accountDelivery;
  }

  @Get('/by-account/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'customer', 'employee')
  findByAccount(@Req() req, @Param('id', ParseIntPipe) accountId: number) {
    const user = req.user;

    console.log('user acc====', user.userId, accountId);
    // Nếu là customer → chỉ cho truy cập chính họ
    if (user.role === 'customer' && user.userId !== accountId) {
      throw new ForbiddenException(
        'Bạn không được phép truy cập tài khoản này',
      );
    }

    return this.accountDeliveryService.findByAccountId(accountId);
  }

  @Get('/by-address/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'customer', 'employee')
  async findByAddress(
    @Req() req,
    @Param('id', ParseIntPipe) addressId: number,
  ) {
    const user = req.user;

    const accountDelivery =
      await this.accountDeliveryService.findByAddressId(addressId);

    if (!accountDelivery) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }

    console.log('user ====', user);
    // Nếu là customer → chỉ truy cập nếu địa chỉ thuộc về họ
    if (
      user.role === 'customer' &&
      accountDelivery.Account.ID !== user.userId
    ) {
      throw new ForbiddenException('Bạn không có quyền xem địa chỉ này');
    }

    return accountDelivery;
  }
}
