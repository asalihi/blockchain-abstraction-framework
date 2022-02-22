import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, HostListener, ViewChild, ElementRef } from '@angular/core';
import BPMNModeler from 'bpmn-js/lib/Modeler';
import BPMNViewer from 'bpmn-js/lib/NavigatedViewer';
import MinimapModule from 'diagram-js-minimap';
import PropertiesPanelModule from 'bpmn-js-properties-panel';
import LintModule from 'bpmn-js-bpmnlint';
import PropertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/camunda';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';

import BPMNLintConfiguration from '@client/helpers/components/bpmn-modeler/.bpmnlintrc';

const EMPTY_PROCESS: string = `
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process" isExecutable="false">
    <bpmn:startEvent id="start" name="start">
      <bpmn:outgoing>flow_start_end</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:endEvent id="end" name="end">
      <bpmn:incoming>flow_start_end</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="flow_start_end" sourceRef="start" targetRef="end" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram">
    <bpmndi:BPMNPlane id="BPMNPlane" bpmnElement="Process">
      <bpmndi:BPMNEdge id="flow_start_end_di" bpmnElement="flow_start_end">
        <di:waypoint x="192" y="99" />
        <di:waypoint x="242" y="99" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNShape id="start_di" bpmnElement="start">
        <dc:Bounds x="156" y="81" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="163" y="124" width="23" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="end_di" bpmnElement="end">
        <dc:Bounds x="242" y="81" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="251" y="124" width="19" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
`;

@Component({
  selector: 'app-bpmn-modeler',
  templateUrl: './bpmn-modeler.component.html',
  styleUrls: ['./bpmn-modeler.component.sass', './bpmn-modeler.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class BPMNModelerComponent implements OnInit {
  private controller: BPMNViewer | BPMNModeler;
  private model_content: string;
  @Input() mode: 'view' | 'creation' | 'edition' = 'view';
  @Output() errors: EventEmitter<boolean> = new EventEmitter<boolean>();
  public has_errors: boolean;
  public nb_errors: number;
  public nb_warnings: number;
  private linting_is_active: boolean = true;

  constructor() { }

  ngOnInit() { }

  ngAfterViewInit(): void {
    if (this.mode === 'view') {
      this.controller = new BPMNViewer({
        container: '#canvas',
        width: '100%',
        height: '100%',
        linting: {
          bpmnlint: BPMNLintConfiguration,
          active: true
        },
        additionalModules: [
          MinimapModule,
          LintModule
        ]
      });
    } else {
      this.controller = new BPMNModeler({
        container: '#canvas',
        width: '100%',
        height: '100%',
        propertiesPanel: {
          parent: '#properties'
        },
        linting: {
          bpmnlint: BPMNLintConfiguration,
          active: true
        },
        additionalModules: [
          PropertiesPanelModule,
          PropertiesProviderModule,
          LintModule
        ],
        moddleExtensions: {
          camunda: camundaModdleDescriptor
        }
      });
    };
    this.initialize();
  }

  get model(): string {
    return this.model_content;
  }

  @Input()
  set model(model_content: string) {
    this.model_content = model_content;
    this.initialize();
  }

  @ViewChild('canvas') canvas: ElementRef;

  async initialize(): Promise<void> {
    try {
      if(['view', 'edition'].includes(this.mode)) await this.controller.importXML(this.model);
      else await this.controller.importXML(EMPTY_PROCESS);

      this.errors.subscribe((status: boolean) => this.has_errors = status);

      this.controller.on('linting.completed', (event: { issues?: Object }) => {
        if (Object.values(event.issues).some((array_of_issues: any[]) => array_of_issues.some((issue: any) => issue['category'] === 'error'))) {
          this.errors.emit(true);
          let count_elements_of_category: (elements: any[], category: 'error' | 'warn') => number = (elements: any[], category: 'error' | 'warn') => elements.filter((issue: any) => issue['category'] === category).length;
          this.nb_errors = Object.values(event.issues).reduce((previous: number, current: any[]) => previous + count_elements_of_category(current, 'error'), 0);
          this.nb_warnings = Object.values(event.issues).reduce((previous: number, current: any[]) => previous + count_elements_of_category(current, 'warn'), 0);
        }
        else this.errors.emit(false);
      });

      this.controller.on('linting.toggle', (event: LintModule.InternalEvent) => {
        this.linting_is_active = event['active'];
      });

      this.canvas.nativeElement.querySelector('.bjsl-button').remove();
    } catch {
      this.errors.emit(true);
    }
  }

  async fetch(): Promise<string | null> {
    try {
      if (!this.linting_is_active) this.controller.get('linting').update();

      if (!this.has_errors) return (await this.controller.saveXML({ format: true }))['xml'];
      else return null;
    } catch {
      return null;
    };
  }

  @HostListener("window:keydown", ['$event'])
  handle_key_input(event: KeyboardEvent): boolean {
    let character_code = String.fromCharCode(event.which).toLowerCase();

    if (event.ctrlKey && character_code === 'z') {
      event.preventDefault();
      let command_stack: any = this.controller.get('commandStack');
      if (event.shiftKey) command_stack.redo();
      else command_stack.undo();
      return false;
    }
  }
}
