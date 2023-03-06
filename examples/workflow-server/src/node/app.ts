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
import { configureELKLayoutModule } from '@eclipse-glsp/layout-elk';
import {
    createAppModule,
    GModelStorage,
    Logger,
    LoggerFactory,
    SocketServerLauncher,
    WebSocketServerLauncher
} from '@eclipse-glsp/server/node';
import { Container } from 'inversify';
import { WorkflowLayoutConfigurator } from '../common/layout/workflow-layout-configurator';
import { WorkflowDiagramModule, WorkflowServerModule } from '../common/workflow-diagram-module';
import { createWorkflowCliParser } from './workflow-cli-parser';

export async function launch(argv?: string[]): Promise<void> {
    let logger: Logger | undefined;
    try {
        const options = createWorkflowCliParser().parse(argv);
        const appContainer = new Container();
        appContainer.load(createAppModule(options));

        logger = appContainer.get<LoggerFactory>(LoggerFactory)('WorkflowServerApp');

        const elkLayoutModule = configureELKLayoutModule({ algorithms: ['layered'], layoutConfigurator: WorkflowLayoutConfigurator });
        const serverModule = new WorkflowServerModule().configureDiagramModule(
            new WorkflowDiagramModule(() => GModelStorage),
            elkLayoutModule
        );

        if (options.webSocket) {
            const launcher = appContainer.resolve(WebSocketServerLauncher);
            launcher.configure(serverModule);
            launcher.start({ port: options.port, host: options.host, path: 'workflow' });
        } else {
            const launcher = appContainer.resolve(SocketServerLauncher);
            launcher.configure(serverModule);
            launcher.start({ port: options.port, host: options.host });
        }
    } catch (error) {
        (logger ?? console).error('Error in workflow server launcher:', error);
    }
}
