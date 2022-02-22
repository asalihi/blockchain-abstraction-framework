import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';

import { Resolve as ResolveContent, ResolvedValue } from '@client/helpers/utils/resolver';
import { VersionController } from '@client/helpers/services/track-and-trace/versions/controller.service';
import { IVersionInformation } from '@client/helpers/models/track-and-trace/version';

@Injectable({ providedIn: 'root' })
export class VersionResolver implements Resolve<ResolvedValue<IVersionInformation>> {

  constructor(private service: VersionController) { }

  resolve(route: ActivatedRouteSnapshot): Observable<ResolvedValue<IVersionInformation>> {
    return ResolveContent(this.service.fetch(route.params.process, route.params.version), null);
  }
}
