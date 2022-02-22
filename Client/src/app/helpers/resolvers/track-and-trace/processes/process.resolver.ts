import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';

import { Resolve as ResolveContent, ResolvedValue } from '@client/helpers/utils/resolver';
import { ProcessController } from '@client/helpers/services/track-and-trace/processes/controller.service';
import { IProcessInformation } from '@client/helpers/models/track-and-trace/process';

@Injectable({ providedIn: 'root' })
export class ProcessResolver implements Resolve<ResolvedValue<IProcessInformation>> {
   
  constructor(private service: ProcessController) { }

  resolve(route: ActivatedRouteSnapshot): Observable<ResolvedValue<IProcessInformation>> {
    return ResolveContent(
      this.service.fetch(route.params.id), null);

    /* TODO: REMOVE
     * ALTERNATIVE: REDIRECTION + RETHROW
        let url: any = route.pathFromRoot.filter(v => v.url.length > 0).map(v => v.url.map(segment => segment.toString()).join('/')).join('/');
        this.router.events.pipe(filter(event => event instanceof NavigationEnd), take(1)).subscribe(() => this.location.replaceState(url));
        this.router.navigateByUrl('/not-found', { skipLocationChange: true });
        return throwError(error);
    */
  }
}
