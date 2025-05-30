import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCartDto } from 'src/DTO/cart/create-cart.dto';
import { UpdateCartDto } from 'src/DTO/cart/update-cart.dto';
import { Account } from 'src/entities/account.entity';
import { Cart } from 'src/entities/cart.entity';
import { GlassColor } from 'src/entities/glass_color.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(Account) private accountRepo: Repository<Account>,
    @InjectRepository(GlassColor)
    private glassColorRepo: Repository<GlassColor>,
  ) {}

  async addToCart(dto: CreateCartDto): Promise<Cart> {
    const account = await this.accountRepo.findOneBy({ ID: dto.accountId });
    const glassColor = await this.glassColorRepo.findOneBy({
      ID: dto.glassColorId,
    });
    const cartItem = this.cartRepo.create({
      account: { ID: dto.accountId },
      glassColor: { ID: dto.glassColorId },
      quantity: dto.quantity,
    });
    return this.cartRepo.save(cartItem);
  }

  async updateQuantity(
    cartId: number,
    dto: UpdateCartDto,
    userId: number,
  ): Promise<Cart> {
    const cart = await this.cartRepo.findOne({
      where: { id: cartId },
      relations: ['account'],
    });

    if (!cart) {
      throw new NotFoundException('Cart item not found');
    }

    if (cart.account.ID !== userId)
      throw new ForbiddenException('Access denied');

    cart.quantity = dto.quantity;
    return this.cartRepo.save(cart);
  }

  async remove(cartId: number, userId: number): Promise<void> {
    const cart = await this.cartRepo.findOne({
      where: { id: cartId },
      relations: ['account'],
    });

    if (!cart) {
      throw new Error('Cart item not found');
    }

    if (cart.account.ID !== userId) {
      throw new Error('Unauthorized to delete this cart item');
    }

    await this.cartRepo.remove(cart);
  }

  async findByAccountId(accountId: number): Promise<Cart[]> {
    return this.cartRepo.find({
      where: { account: { ID: accountId } },
      relations: {
        glassColor: {
          Glass: true,
        },
      },
    });
  }
}
