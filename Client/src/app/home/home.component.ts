import { Component, OnInit } from '@angular/core';

import { AuthenticationService } from '@client/helpers/services/authentication.service';
import { User } from '@client/helpers/models/user';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {
	user:User;

	constructor(private authenticationService: AuthenticationService) {}

	async ngOnInit():Promise<void> {
		this.user = await this.authenticationService.session();
	}
}
