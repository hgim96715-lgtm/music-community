import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateRecommendationDto } from "./dto/create-recommendation.dto";

@Injectable()
export class RecommendationsService {
    constructor(private readonly prisma: PrismaService) {}

    findAll(){
        return this.prisma.recommendation.findMany({
            where:{hidden:false},
            orderBy:{createdAt:'desc'},
            include:{reactions:true}
        })
    }

    create(dto:CreateRecommendationDto){
        const {title,artist,embedUrl,reason,moods} = dto;
        return this.prisma.recommendation.create({
            data:{
                title,
                artist,
                embedUrl,
                reason,
                moods,
            },
            include:{reactions:true}
        });
    }
}