import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable } from 'rxjs';

import { Resolve as ResolveContent, ResolvedValue } from '@client/helpers/utils/resolver';
import { InstanceController } from '@client/helpers/services/track-and-trace/instances/controller.service';
import { IInstance } from '@client/helpers/models/track-and-trace/instance';

@Injectable({ providedIn: 'root' })
export class InstanceResolver implements Resolve<ResolvedValue<IInstance>> {

  constructor(private service: InstanceController) { }

  resolve(route: ActivatedRouteSnapshot): Observable<ResolvedValue<IInstance>> {
    return ResolveContent(this.service.fetch(route.params.process, route.params.version, route.params.instance), null);
  }
}
