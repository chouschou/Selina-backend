import { Expose } from 'class-transformer';

export class CustomerInfoDto {
  @Expose({ name: 'ID' })
  id: number;

  @Expose({ name: 'Email' })
  email: string;

  @Expose({ name: 'Name' })
  name: string;

  @Expose({ name: 'Gender' })
  gender: string;

  @Expose({ name: 'PhoneNumber' })
  phoneNumber: string;

  @Expose({ name: 'DateOfBirth' })
  dateOfBirth: Date;

  @Expose({ name: 'Avatar' })
  avatar: string;
}
