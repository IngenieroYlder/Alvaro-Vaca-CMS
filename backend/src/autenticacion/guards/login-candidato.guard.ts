import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LoginCandidatoGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err || !user) {
            const response = context.switchToHttp().getResponse();
            return response.redirect('/login-candidato?error=login_required');
        }
        return user;
    }
}
