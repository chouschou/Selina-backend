import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Glass } from 'src/entities/glass.entity';
import { GlassController } from './glass.controller';
import { GlassService } from './glass.service';

@Module({
  imports: [TypeOrmModule.forFeature([Glass])],
  controllers: [GlassController],
  providers: [GlassService],
})
export class GlassModule {}
