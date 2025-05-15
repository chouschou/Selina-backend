import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermission } from './role_permission.entity';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ length: 100, nullable: false })
  Name: string;

  @Column({ length: 10, nullable: false })
  Method: string;

  @OneToMany(() => RolePermission, (rp) => rp.Permission)
  RolePermissions: RolePermission[];
}
