import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsIn,
    IsNotEmpty,
    IsString,
  } from 'class-validator';


const MOODS = [
    '새벽',
    '운전',
    '집중',
    '운동',
    '비',
    '설렘',
    '우울',
    '파티',
    '힐링',
    '그리움',
  ] as const;



export class CreateRecommendationDto {
    @IsString()
    @IsNotEmpty()
    title:string;

    @IsString()
    @IsNotEmpty()
    artist:string;

    @IsString()
    @IsNotEmpty()
    embedUrl:string;

    @IsString()
    @IsNotEmpty()
    reason:string;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(3)
    @IsIn(MOODS,{each:true})
    moods:string[];

}