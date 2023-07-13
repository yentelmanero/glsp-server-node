/********************************************************************************
 * Copyright (c) 2022-2023 STMicroelectronics and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { Action, RequestModelAction, ServerStatusAction } from '@eclipse-glsp/protocol';
import { inject, injectable } from 'inversify';
import { ActionDispatcher } from '../../actions/action-dispatcher';
import { ActionHandler } from '../../actions/action-handler';
import { Logger } from '../../utils/logger';
import { ProgressMonitor, ProgressService } from '../progress/progress-service';
import { ModelState } from './model-state';
import { ModelSubmissionHandler } from './model-submission-handler';
import { SourceModelStorage } from './source-model-storage';

@injectable()
export class RequestModelActionHandler implements ActionHandler {
    actionKinds = [RequestModelAction.KIND];

    @inject(Logger)
    private logger: Logger;

    @inject(SourceModelStorage)
    protected sourceModelStorage: SourceModelStorage;

    @inject(ActionDispatcher)
    protected actionDispatcher: ActionDispatcher;

    @inject(ModelState)
    protected modelState: ModelState;

    @inject(ModelSubmissionHandler)
    protected submissionHandler: ModelSubmissionHandler;

    @inject(ProgressService)
    protected progressService: ProgressService;

    async execute(action: RequestModelAction): Promise<Action[]> {
        this.logger.debug('Execute RequestModelAction:', action);
        this.modelState.setAll(action.options ?? {});

        const progress = this.reportModelLoading('Model loading in progress');
        await this.sourceModelStorage.loadSourceModel(action);
        this.reportModelLoadingFinished(progress);

        return this.submissionHandler.submitModel();
    }

    protected reportModelLoading(message: string): ProgressMonitor {
        this.actionDispatcher.dispatch(ServerStatusAction.create(message, { severity: 'INFO' }));
        return this.progressService.start(message);
    }

    protected reportModelLoadingFinished(monitor: ProgressMonitor): void {
        this.actionDispatcher.dispatch(ServerStatusAction.create('', { severity: 'NONE' }));
        monitor.end();
    }
}
