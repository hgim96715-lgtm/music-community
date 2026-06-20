import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { JwtPayload } from "./jwt-auth.guard";

@Injectable()
export class AdminGuard implements CanActivate{
    canActivate(context:ExecutionContext):boolean{
        const request=context.switchToHttp().getRequest<{user?:JwtPayload}>();
        
        if(request.user?.role !== 'admin'){
            throw new ForbiddenException('관리자 권한이 필요합니다.');
        }
        return true;
    }
}