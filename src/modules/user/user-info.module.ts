import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInfoService } from './user-info.service';
import { UserInfoController } from './user-info.controller';
import { Customer } from 'src/entities/customer.entity';
import { Store } from 'src/entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Store])],
  providers: [UserInfoService],
  controllers: [UserInfoController],
})
export class UserInfoModule {}
