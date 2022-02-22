import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { ProcessController } from '@client/helpers/services/track-and-trace/processes/controller.service';
import { InstanceController } from '@client/helpers/services/track-and-trace/instances/controller.service';
import { IProcessStatistics } from '@client/helpers/models/track-and-trace/process';
import { IInstanceStatistics } from '@client/helpers/models/track-and-trace/instance';
import { Resolve, ResolvedValue } from '@client/helpers/utils/resolver';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass']
})
export class DashboardComponent implements OnInit {
    statistics_about_processes: Observable<ResolvedValue<IProcessStatistics>>;
    statistics_about_instances: Observable<ResolvedValue<IInstanceStatistics>>;

    constructor(private process_controller: ProcessController, private instance_controller: InstanceController) {
        this.statistics_about_processes = Resolve<IProcessStatistics>(this.process_controller.fetch_statistics());
        this.statistics_about_instances = Resolve<IProcessStatistics>(this.instance_controller.fetch_statistics());
    }

  ngOnInit(): void {
  }

}
