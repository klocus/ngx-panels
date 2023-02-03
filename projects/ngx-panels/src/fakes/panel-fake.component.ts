import { Component, EventEmitter } from '@angular/core';

import { IPanelComponent } from '../lib/components/panel/panel.interface';


@Component({
    selector: 'ngx-panel',
    template: '<div></div>'
})
export class PanelFakeComponent implements IPanelComponent {
    contentContainer: any = {
        insert: jasmine.createSpy('insert')
    };
    panelOpenAnimationEnd: EventEmitter<boolean> = new EventEmitter<boolean>();
    panelCloseAnimationEnd: EventEmitter<boolean> = new EventEmitter<boolean>();
    startCloseAnimation: jasmine.Spy = jasmine.createSpy('startCloseAnimation');
    onAnimationEvent: jasmine.Spy = jasmine.createSpy('onAnimationEvent');
}
