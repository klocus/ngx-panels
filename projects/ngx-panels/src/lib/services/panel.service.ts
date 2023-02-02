import { ComponentFactory, ComponentFactoryResolver, ComponentRef, Injectable, Injector, Type, StaticProvider } from '@angular/core';

import { PanelRef } from '../classes/panel-ref.class';
import { PanelContainerComponent } from '../components/panel-container/panel-container.component';
import { PanelComponent } from '../components/panel/panel.component';
import { IPanelComponent } from '../components/panel/panel.interface';
import { PanelStatusService } from './panel-status.service';


export interface IPanelService {
    setContainer(panelContainer: PanelContainerComponent);
    openAsRoot<Content, Data>(content: Type<Content>, data?: Data, providers?: StaticProvider[]): PanelRef<Data>;
    closeAll();
    open<Content, Data>(content: Type<Content>, data?: Data, providers?: StaticProvider[]): PanelRef<Data>;
}

@Injectable()
export class PanelService implements IPanelService {
    private panelContainer: PanelContainerComponent;

    constructor(
        private readonly injector: Injector,
        private readonly resolver: ComponentFactoryResolver,
        private readonly panelStatusService: PanelStatusService
    ) {}

    // this method must not be called manually
    setContainer(panelContainer: PanelContainerComponent) {
        if (this.panelContainer) {
            throw Error('You are using two <ngx-panel-containers> inside HTML. Please leave just one.');
        }
        this.panelContainer = panelContainer;
    }

    openAsRoot<Content, Data>(content: Type<Content>, data?: Data, providers?: StaticProvider[]): PanelRef<Data> {
        this.closeAll();
        this.panelStatusService.reset();
        this.panelStatusService.increment();
        const panelRef: PanelRef<Data> = this.appendPanel(PanelComponent, content, data, providers);
        this.panelStatusService.notifyOpen();
        return panelRef;
    }

    closeAll() {
        this.panelStatusService.reset();
        this.panelContainer.destroyAll();
    }

    open<Content, Data>(content: Type<Content>, data?: Data, providers?: StaticProvider[]): PanelRef<Data> {
        const wasOpenBefore: boolean = this.panelStatusService.isOpen;
        this.panelStatusService.increment();
        const panelRef: PanelRef<Data> = this.appendPanel(PanelComponent, content, data, providers);
        if (!wasOpenBefore) {
            this.panelStatusService.notifyOpen();
        }
        return panelRef;
    }

    private appendPanel<Panel extends IPanelComponent, Content, Data>(
        panel: Type<Panel>,
        content: Type<Content>,
        data: Data,
        providers: StaticProvider[] = []
    ): PanelRef<Data> {
        // PanelRef is added to the injector so that the Body and the Header can access to it
        // (mainly for calling close action)
        const panelRef: PanelRef<Data> = new PanelRef<Data>();
        const childInjector: Injector = Injector.create({
            providers: [...providers, { provide: PanelRef, useValue: panelRef }],
            parent: this.injector
        });

        const contentFactory: ComponentFactory<Content> = this.resolver.resolveComponentFactory(content);
        const contentComponentRef: ComponentRef<Content> = contentFactory.create(childInjector);

        const panelComponentFactory: ComponentFactory<Panel> = this.resolver.resolveComponentFactory(panel);
        const panelComponentRef: ComponentRef<Panel> = panelComponentFactory.create(this.injector);

        panelRef.setComponents(panelComponentRef, this.panelContainer);

        panelComponentRef.instance.panelCloseAnimationEnd.subscribe(() => {
            this.panelContainer.destroyTopPanel();
            this.panelStatusService.decrement();
        });

        if (data) {
            panelRef.setData(data);
        }
        panelComponentRef.instance.contentContainer.insert(contentComponentRef.hostView);
        panelRef.guestComponent = contentComponentRef.instance;

        this.panelContainer.addTopPanel(panelRef);

        return panelRef;
    }
}
