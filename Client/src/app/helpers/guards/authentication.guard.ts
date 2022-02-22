import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthenticationService } from '@client/helpers/services/authentication.service';
import { User } from '@client/helpers/models/user';

@Injectable({ providedIn: 'root' })
export class AuthenticationGuard implements CanActivate {
    constructor(private router: Router, private authenticationService: AuthenticationService) {}

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const user:User = await this.authenticationService.session();
        if (user) {
            if (route.data.roles?.includes(user.role)) {
                return true;
            } else {
                this.router.navigate(['/']);
                return false;
            }
        } else {
            this.router.navigate(['/authentication/login'], { queryParams: { return: state.url } });
            return false;
        }
    }
}