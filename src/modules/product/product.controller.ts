import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFiles,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from 'src/DTO/product/create-product.dto';
import { UpdateProductDto } from 'src/DTO/product/update-product.dto';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

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
  @UseInterceptors(AnyFilesInterceptor()) // thu thập tất cả file
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    return this.productService.createWithFiles(body, files);
  }

  // @Put(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('owner')
  // update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
  //   return this.productService.update(id, dto);
  // }
  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    return this.productService.updateWithFiles(id, body, files);
  }

  @Post('all/by-shapes')
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

  @Get(':id/used-colors')
  async getUsedGlassColors(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ usedColors: string[] }> {
    const usedColors = await this.productService.findUsedGlassColors(id);
    return { usedColors };
  }

  @Get('glass-colors/:id/order-count')
  async getOrderCountByGlassColor(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ count: number }> {
    const count = await this.productService.countOrdersWithGlassColor(id);
    return { count };
  }

  // Endpoint xoá GlassColor (và có thể xoá Glass nếu chỉ còn 1 color)
  @Delete('glass-colors/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGlassColor(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.productService.deleteGlassColor(id);
  }
}
