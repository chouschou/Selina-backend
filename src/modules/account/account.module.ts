import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/entities/account.entity';
import { Role } from 'src/entities/role.entity';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { S3Module } from 'src/shared/s3.module';
import { Customer } from 'src/entities/customer.entity';
import { S3Service } from 'src/shared/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Role, Customer])],
  controllers: [AccountController],
  providers: [AccountService, S3Service],
  exports: [AccountService],
})
export class AccountModule {}
