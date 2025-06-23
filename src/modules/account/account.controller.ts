import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  Req,
  Patch,
  Put,
  UseInterceptors,
  ParseIntPipe,
  UploadedFile,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from 'src/DTO/auth/create-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/entities/role.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  ChangeEmployeePasswordDto,
  ChangeOwnPasswordDto,
} from 'src/DTO/auth/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateCustomerDto } from 'src/DTO/customer/update-info-customer';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post(':id/customer')
  @UseInterceptors(FileInterceptor('avatar'))
  async createCustomerInfo(
    @Param('id') id: number,
    @Body() body: UpdateCustomerDto,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ) {
    const customer = await this.accountService.createCustomerInfo(
      id,
      body,
      avatarFile,
    );
    return { message: 'Tạo thông tin khách hàng thành công', customer };
  }

  @Patch(':id/customer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'employee', 'customer')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateCustomerProfile(
    @Param('id') id: number,
    @Body() body: UpdateCustomerDto,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ) {
    const customer = await this.accountService.updateCustomerInfo(
      id,
      body,
      avatarFile,
    );
    console.log('body', body);
    console.log('avatarFile', avatarFile);
    return { message: 'Cập nhật thành công', customer };
  }

  @Post()
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountService.create(createAccountDto);
  }

  @Get()
  findAll() {
    return this.accountService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'employee', 'customer')
  findOne(@Req() req, @Param('id') id: string) {
    const user = req.user;

    console.log('user acc====', user.userId, id);
    // Nếu là customer → chỉ cho truy cập chính họ
    if (user.role === 'customer' && user.userId !== parseInt(id)) {
      throw new ForbiddenException(
        'Bạn không được phép truy cập tài khoản này',
      );
    }
    return this.accountService.findOne(+id);
  }

  @Patch('change-own-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'employee', 'customer')
  changeOwnPassword(@Req() req, @Body() dto: ChangeOwnPasswordDto) {
    const userId = req.user.userId;
    return this.accountService.changeOwnPassword(userId, dto);
  }

  @Patch('change-employee-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner') // Chỉ chủ cửa hàng được phép
  changeEmployeePassword(@Body() dto: ChangeEmployeePasswordDto) {
    return this.accountService.changeEmployeePassword(dto);
  }
}
