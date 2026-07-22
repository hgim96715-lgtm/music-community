import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSupportContactDto {
  @IsEmail()
  fromEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  nickname?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  subject: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;
}
