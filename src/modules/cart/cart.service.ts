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
import { Image } from 'src/entities/image.entity';
import { DataSource, Repository } from 'typeorm';
interface GlassColorWithImage extends GlassColor {
  Image?: string;
}
@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(Account) private accountRepo: Repository<Account>,
    @InjectRepository(GlassColor)
    private glassColorRepo: Repository<GlassColor>,
    private dataSource: DataSource,
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

  async findByAccountId(
    accountId: number,
  ): Promise<{ carts: Cart[]; totalItems: number; totalQuantity: number }> {
    const carts = await this.cartRepo.find({
      where: { account: { ID: accountId } },
      relations: {
        glassColor: {
          Glass: true,
        },
      },
    });

    const totalQuantity = carts.reduce((sum, cart) => sum + cart.quantity, 0);
    const totalItems = carts.length;

    // Lấy ID các glassColor trong giỏ hàng
    const glassColorIds = carts
      .map((cart) => cart.glassColor?.ID)
      .filter((id): id is number => typeof id === 'number');

    // Lấy ảnh tương ứng từ bảng Image
    const images = await this.dataSource
      .getRepository(Image)
      .createQueryBuilder('image')
      .where('image.object_type = :type', { type: 'glass_color' })
      .andWhere('image.object_ID IN (:...ids)', { ids: glassColorIds })
      .getMany();

    // Gán ảnh vào từng glassColor
    for (const cart of carts) {
      const gc = cart.glassColor as GlassColorWithImage;
      const foundImage = images.find((img) => img.object_ID === gc.ID);
      if (foundImage) {
        gc.Image = foundImage.ImagePath;
      }
    }

    return { carts, totalItems, totalQuantity };
  }
}
