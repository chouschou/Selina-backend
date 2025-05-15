import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity()
export class RolePermission {
  @PrimaryGeneratedColumn()
  ID: number;

  @ManyToOne(() => Role, (role) => role.RolePermissions)
  @JoinColumn({ name: 'Role_ID' })
  Role: Role;

  @ManyToOne(() => Permission, (permission) => permission.RolePermissions)
  @JoinColumn({ name: 'Permission_ID' })
  Permission: Permission;
}
