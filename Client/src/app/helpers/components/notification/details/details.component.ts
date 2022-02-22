import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'notification-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.sass']
})
export class NotificationDetailsComponent implements OnInit {
  @Input() options: Object;
  @Input() data: Object;

  constructor() { }

  ngOnInit(): void { }

  get_container_classes(): Object {
    let border_is_set: boolean = this.options?.['container']?.['border']?.['visible'] !== false;
    let border_color: string = `bg-${['dark', 'danger', 'warning', 'primary', 'success', 'white', 'transparent'].includes(this.options?.['container']?.['border']?.['color']) ? this.options['container']['border']['color'] : 'dark' }`;
    return Object.assign({ ...((border_is_set) && { 'border': true }), ...((border_is_set) && { [border_color]: true }) });
  }

  get_container_styles(): Object {
    let border_is_set: boolean = this.options?.['container']?.['border']?.['visible'] !== false;
    return Object.assign({ ...((border_is_set) && { 'border-width': this.options?.['container']?.['border']?.['size'] ?? '3px!important' }) });
  }

  get_title_classes(): Object {
    return this.get_classes('headers');
  }

  get_content_classes(): Object {
    return this.get_classes('content');
  }

  private get_classes(where: 'headers'|'content'): Object {
    let background_color: string = `bg-${['dark', 'danger', 'warning', 'primary', 'success', 'white', 'transparent'].includes(this.options?.[where]?.['background']?.['color']) ? this.options[where]['background']['color'] : 'dark'}`;
    let text_color: string = `text-${['dark', 'danger', 'warning', 'primary', 'success', 'white'].includes(this.options?.[where]?.['text']?.['color']) ? this.options[where]['text']['color'] : 'white'}`;
    return Object.assign({ [background_color]: true, [text_color]: true });
  }
}
