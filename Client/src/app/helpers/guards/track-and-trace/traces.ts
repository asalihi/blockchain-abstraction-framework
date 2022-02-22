import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class TracesDisplayerGuard implements CanActivate {
    constructor(private router: Router) {}

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if(['traces', 'updates'].includes(route.params.context)) return true;
        else return false;
    }
}