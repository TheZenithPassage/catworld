import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

import { AuthSessionService } from '../auth/auth-session.service';
import {
  CatCreationDraft,
  CREATION_FLOW_QUERY_PARAM,
  CreationFlowFrames,
  CreationFlowHop,
  CreationFlowId,
  CreationFlowRoot,
  StayCreationDraft,
} from './creation-flow.models';

interface ActiveCreationFlow {
  id: CreationFlowId;
  root: CreationFlowRoot;
  frames: Partial<CreationFlowFrames>;
  expectedHop: CreationFlowHop | null;
  arrivedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class CreationFlowService {
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private activeFlow: ActiveCreationFlow | null = null;

  constructor() {
    const subscription = this.router.events
      .pipe(filter((event): event is NavigationStart => event instanceof NavigationStart))
      .subscribe((event) => this.handleNavigation(event));
    this.destroyRef.onDestroy(() => subscription.unsubscribe());

    let hadSession = this.authSession.authenticated() !== null;
    effect(() => {
      const authenticated = this.authSession.authenticated() !== null;
      if (hadSession && !authenticated) this.clear();
      hadSession = authenticated;
    });
  }

  start(root: CreationFlowRoot): CreationFlowId {
    this.clear();
    const id = this.createId();
    this.activeFlow = { id, root, frames: {}, expectedHop: null, arrivedAt: null };
    return id;
  }

  has(flowId: string | null): flowId is CreationFlowId {
    return flowId !== null && this.activeFlow?.id === flowId;
  }

  root(flowId: string): CreationFlowRoot | null {
    const flow = this.activeFlow;
    return flow?.id === flowId ? flow.root : null;
  }

  captureCat(flowId: CreationFlowId, draft: CatCreationDraft): boolean {
    return this.capture(flowId, 'cat', draft);
  }

  captureStay(flowId: CreationFlowId, draft: StayCreationDraft): boolean {
    return this.capture(flowId, 'stay', { ...draft, catIds: [...draft.catIds] });
  }

  consumeCat(flowId: string, at = '/cats/new'): CatCreationDraft | null {
    return this.consume(flowId, 'cat', at);
  }

  consumeStay(flowId: string, at = '/stays/new'): StayCreationDraft | null {
    const draft = this.consume(flowId, 'stay', at);
    return draft ? { ...draft, catIds: [...draft.catIds] } : null;
  }

  expectHop(flowId: CreationFlowId, from: string, to: string): boolean {
    const flow = this.activeFlow;
    if (flow?.id !== flowId) return false;
    flow.expectedHop = { from, to };
    flow.arrivedAt = null;
    return true;
  }

  clear(flowId?: string): void {
    if (flowId === undefined || this.activeFlow?.id === flowId) this.activeFlow = null;
  }

  private capture<K extends keyof CreationFlowFrames>(
    flowId: CreationFlowId,
    kind: K,
    draft: CreationFlowFrames[K],
  ): boolean {
    const flow = this.activeFlow;
    if (flow?.id !== flowId) return false;
    flow.frames[kind] = draft;
    return true;
  }

  private consume<K extends keyof CreationFlowFrames>(
    flowId: string,
    kind: K,
    at: string,
  ): CreationFlowFrames[K] | null {
    const flow = this.activeFlow;
    if (flow?.id !== flowId || flow.arrivedAt !== at) return null;
    const draft = flow.frames[kind] as CreationFlowFrames[K] | undefined;
    if (!draft) return null;
    delete flow.frames[kind];
    flow.arrivedAt = null;
    return draft;
  }

  private handleNavigation(event: NavigationStart): void {
    if (!this.activeFlow) return;
    if (event.navigationTrigger !== 'imperative') {
      this.clear();
      return;
    }

    const tree = this.router.parseUrl(event.url);
    const flowId = tree.queryParams[CREATION_FLOW_QUERY_PARAM];
    const path = `/${tree.root.children['primary']?.segments.map((segment) => segment.path).join('/') ?? ''}`;
    const expected = this.activeFlow.expectedHop;
    if (flowId !== this.activeFlow.id || expected?.to !== path) {
      this.clear();
      return;
    }

    this.activeFlow.expectedHop = null;
    this.activeFlow.arrivedAt = path;
  }

  private createId(): CreationFlowId {
    const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    return value as CreationFlowId;
  }
}
