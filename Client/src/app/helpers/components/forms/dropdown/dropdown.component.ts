import { Component, OnInit, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type DropdownOption = { 'value': string, 'name'?: string };

@Component({
  selector: 'dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.sass'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DropdownComponent),
    multi: true,
  }]
})
export class DropdownComponent implements OnInit, ControlValueAccessor {
  @Input() options: DropdownOption[];
  @Input() selected: DropdownOption;
  onChange: (_: any) => {};

  constructor() { }

  ngOnInit() { }


  writeValue(value: DropdownOption) {
    this.selected = value;
  }

  registerOnChange(fn: (_: any) => {}) {
    this.onChange = fn;
  }

  select(option: DropdownOption) {
    this.selected = option;
    this.onChange(this.selected['value']);
  }

  registerOnTouched() { }
}
