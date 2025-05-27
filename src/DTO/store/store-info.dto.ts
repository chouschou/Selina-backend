import { Expose } from 'class-transformer';

export class StoreInfoDto {
  @Expose({ name: 'ID' })
  id: number;

  @Expose({ name: 'Name' })
  name: string;

  @Expose({ name: 'Avatar' })
  avatar: string;
}
