import { IsString, MaxLength, MinLength } from 'class-validator';

export class ToggleRoomMessageReactioinDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  emoji!: string;
}
