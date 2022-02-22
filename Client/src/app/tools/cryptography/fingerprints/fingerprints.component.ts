import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { md } from 'node-forge';

interface IError {
  'type'?: 'invalid-or-missing-fields',
  'activated': boolean
}

@Component({
  selector: 'app-fingerprints',
  templateUrl: './fingerprints.component.html',
  styleUrls: ['./fingerprints.component.sass']
})
export class FingerprintsComponent implements OnInit {
  form: FormGroup;
  error: IError = { 'activated': false };
  fingerprint: string = 'Fingerprint will appear here.';

  constructor() { }

  ngOnInit(): void {
    this.form = new FormGroup({
      content: new FormControl('', [Validators.required])
    });
  }

  public save(): void {
    if (this.form['valid']) {
      try {
        this.fingerprint = this.computeSHA256(JSON.parse(this.form.controls.content.value));
      } catch {
        this.fingerprint = this.computeSHA256(this.form.controls.content.value);
      }
    } else this.error = { 'activated': true, 'type': 'invalid-or-missing-fields' };
  }

  private computeSHA256(input: string | Object): string {
    // TODO: Create a canonical representation of Object
    return md.sha256.create().update((typeof input === 'string') ? input : JSON.stringify(input)).digest().toHex();
  }
}
