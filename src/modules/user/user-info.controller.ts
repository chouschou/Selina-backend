import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UserInfoService } from './user-info.service';
import { CustomerInfoDto } from 'src/DTO/customer/customer-info.dto';
import { StoreInfoDto } from 'src/DTO/store/store-info.dto';

@Controller('user-info')
export class UserInfoController {
  constructor(private readonly userInfoService: UserInfoService) {}

  @Get('customer/:accountId')
  async getCustomerInfo(
    @Param('accountId', ParseIntPipe) accountId: number,
  ): Promise<CustomerInfoDto> {
    return this.userInfoService.getCustomerByAccountId(accountId);
  }

  @Get('store/:accountId')
  async getStoreInfo(
    @Param('accountId', ParseIntPipe) accountId: number,
  ): Promise<StoreInfoDto> {
    return this.userInfoService.getStoreByAccountId(accountId);
  }
}
