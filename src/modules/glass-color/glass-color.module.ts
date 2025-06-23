import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlassColor } from 'src/entities/glass_color.entity';
import { Glass } from 'src/entities/glass.entity';
import { GlassColorController } from './glass-color.controller';
import { GlassColorService } from './glass-color.service';
import { ImageModule } from '../image/image.module';

@Module({
  imports: [TypeOrmModule.forFeature([GlassColor, Glass]), ImageModule],
  controllers: [GlassColorController],
  providers: [GlassColorService],
})
export class GlassColorModule {}
