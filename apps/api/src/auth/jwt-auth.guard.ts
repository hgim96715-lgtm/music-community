import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { EnvKeys } from "src/config/env.keys";

export type JwtPayload={
    sub:string;
    role:'user'|'admin';
}



@Injectable()
export class JwtAuthGuard implements CanActivate{
    constructor(private readonly jwtService:JwtService,private readonly configService:ConfigService){}

    private extractBearerToken(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' && token ? token : undefined;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
        const token=this.extractBearerToken(request);
        if(!token){
            throw new UnauthorizedException('Bearer 토큰이 필요합니다.');
        }
        try{
            const payload=await this.jwtService.verifyAsync<JwtPayload>(token,{
                secret:this.configService.getOrThrow(EnvKeys.JWT_SECRET),
            });
            request.user=payload;
            return true;
        }catch{
            throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        }
    }

}
