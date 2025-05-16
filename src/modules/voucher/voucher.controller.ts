import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto } from 'src/DTO/voucher/create-voucher.dto';
import { UpdateVoucherDto } from 'src/DTO/voucher/update-voucher.dto';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AddAccountVoucherDto } from 'src/DTO/voucher/add-account-voucher.dto';

@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get()
  getAll() {
    return this.voucherService.getAll();
  }

  @Get(':id')
  getById(@Param('id') id: number) {
    return this.voucherService.getById(id);
  }

  @Get('/account/:accountId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'employee', 'customer')
  getByAccountId(
    @Req() req,
    @Param('accountId', ParseIntPipe) accountId: number,
  ) {
    const user = req.user;
    console.log('user------', user);
    // Nếu là customer → chỉ cho truy cập chính họ
    if (user.role === 'customer' && user.userId !== accountId) {
      throw new ForbiddenException(
        'Bạn không được phép truy cập tài khoản này',
      );
    }
    return this.voucherService.getByAccountId(accountId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  create(@Body() dto: CreateVoucherDto) {
    return this.voucherService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  update(@Param('id') id: number, @Body() dto: UpdateVoucherDto) {
    return this.voucherService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  delete(@Param('id') id: number) {
    return this.voucherService.delete(id);
  }

  // CHỈ DÙNG ĐỂ TEST
  @Get('/test/delete-expired')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  testDeleteExpired(@Req() req) {
    console.log('ĐÃ VÀO ROUTE TEST DELETE EXPIRED');
    console.log('Current user:', req.user);
    return this.voucherService.deleteExpiredVouchers();
  }

  @Post('/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  addAccountVoucher(@Req() req, @Body() dto: AddAccountVoucherDto) {
    const user = req.user;

    // Nếu là customer → chỉ cho truy cập chính họ
    if (user.role === 'customer' && user.userId !== dto.Account_ID) {
      throw new ForbiddenException(
        'Bạn không được phép truy cập tài khoản này',
      );
    }
    return this.voucherService.addAccountVoucher(dto);
  }
}
