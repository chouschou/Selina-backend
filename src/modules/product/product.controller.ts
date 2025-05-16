import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from 'src/DTO/product/create-product.dto';
import { UpdateProductDto } from 'src/DTO/product/update-product.dto';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  getAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  //   @Post()
  //   create(@Body() dto: CreateProductDto) {
  //     return this.productService.create(dto);
  //   }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  // @Put(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('owner')
  // update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
  //   return this.productService.update(id, dto);
  // }
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    const { data, warnings } = await this.productService.update(id, dto);
    return { message: 'Cập nhật thành công', data, warnings };
  }

  @Post('by-shapes')
  getByShapes(@Body('shapes') shapes: string[]) {
    return this.productService.findByShapes(shapes);
  }

  @Get(':id/colors')
  async getColors(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findColorsByProductId(id);
  }

  @Get('by-category/:category')
  getByCategory(@Param('category') category: string) {
    return this.productService.getProductsByCategory(category);
  }

  @Post('filter-by-category')
  filterListByCategory(
    @Body('ids') ids: number[],
    @Body('category') category: string,
  ) {
    return this.productService.filterByIdsAndCategory(ids, category);
  }
}
