import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from 'src/DTO/auth/create-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/entities/role.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

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
    if (user.role === 'customer' && user.userId !== id) {
      throw new ForbiddenException(
        'Bạn không được phép truy cập tài khoản này',
      );
    }
    return this.accountService.findOne(+id);
  }
}
