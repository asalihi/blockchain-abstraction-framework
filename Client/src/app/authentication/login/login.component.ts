import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AuthenticationService } from '@client/helpers/services/authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {
  form: FormGroup;
	loading = false;
    submitted = false;
    returnUrl: string;
    error = '';

  constructor(private formBuilder: FormBuilder, private route: ActivatedRoute, private router: Router, private authenticationService: AuthenticationService) {
    if (this.authenticationService.logged()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.returnUrl = this.route.snapshot.queryParamMap.get('return') || '/';
  }

  	async onSubmit():Promise<void> {
    	this.submitted = true;

        if (this.form.invalid) return;

        this.loading = true;
        try {
        	await this.authenticationService.login(this.form.controls.username.value, this.form.controls.password.value);
        	this.router.navigate([this.returnUrl]);
        } catch (error) {
        	this.error = error;
        	this.loading = false;
        }
    }

}
