import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationExtras, ParamMap, Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';

import { Resolve as ResolveContent, ResolvedValue } from '@client/helpers/utils/resolver';
import { TraceController } from '@client/helpers/services/track-and-trace/traces/controller.service';
import { ITrace } from '@client/helpers/models/track-and-trace/trace';

@Injectable({ providedIn: 'root' })
export class TraceResolver implements Resolve<ResolvedValue<ITrace>> {

  constructor(private service: TraceController) { }

  
  resolve(route: ActivatedRouteSnapshot): Observable<ResolvedValue<ITrace>> {
    const parameters: ParamMap = route.paramMap;
    if(route.paramMap.has('instance')) {
      return ResolveContent(this.service.fetch(route.params.trace, (route.params.context === 'traces') ? 'instances' : 'updates'), null);
    } else if(parameters.has('version')) {
      return ResolveContent(this.service.fetch(route.params.trace, 'versions'), null);
    } else if(parameters.has('process')) {
      return ResolveContent(this.service.fetch(route.params.trace, 'processes'), null);
    } else {
      return ResolveContent(of(null), null);
    } 
  }
}
