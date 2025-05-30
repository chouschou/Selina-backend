import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from 'src/DTO/cart/create-cart.dto';
import { UpdateCartDto } from 'src/DTO/cart/update-cart.dto';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('customer')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  addToCart(@Body() dto: CreateCartDto, @Request() req) {
    const userId = req.user.userId;
    return this.cartService.addToCart({ ...dto, accountId: userId });
  }

  @Patch(':id')
  updateQuantity(
    @Param('id') id: string,
    @Body() dto: UpdateCartDto,
    @Request() req,
  ) {
    return this.cartService.updateQuantity(+id, dto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.cartService.remove(+id, req.user.userId);
  }

  @Get()
  findByAccount(@Request() req) {
    const userId = req.user.userId;
    return this.cartService.findByAccountId(userId);
  }
}
