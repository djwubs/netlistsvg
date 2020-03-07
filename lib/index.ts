'use strict';

import ELK = require('elkjs');
import onml = require('onml');
import _ = require('lodash');
import { FlatModule, arrayToBitstring } from './FlatModule';
import Yosys from './YosysModel';
import Skin from './Skin';
import { ElkModel, buildElkGraph } from './elkGraph';
import drawModule from './drawModule';

const elk = new ELK();

type ICallback = (error: Error, result?: string) => void;

function createFlatModule(skinData: string, yosysNetlist: Yosys.Netlist): FlatModule {
    Skin.skin = onml.p(skinData);
    const layoutProps = Skin.getProperties();
    const flatModule = new FlatModule(yosysNetlist);
    // this can be skipped if there are no 0's or 1's
    if (layoutProps.constants !== false) {
        flatModule.addConstants();
    }
    // this can be skipped if there are no splits or joins
    if (layoutProps.splitsAndJoins !== false) {
        flatModule.addSplitsJoins();
    }
    flatModule.createWires();
    return flatModule;
}

function getHighlightId(highlight: string, yosysNetlist: Yosys.Netlist): string {
    if (highlight) {
        let moduleName: string;
        _.forEach(yosysNetlist.modules, (mod: Yosys.Module, name: string) => {
            if (mod.attributes && mod.attributes.top === 1) {
                moduleName = name;
            }
        });
        if (moduleName == null) {
            moduleName = Object.keys(yosysNetlist.modules)[0];
        }
        const top = yosysNetlist.modules[moduleName];

        if (highlight.includes(' ')) {
            const highlightSplit: string[] = highlight.split(' ');
            const hModule: string = highlightSplit[0];
            const hConnection: string = highlightSplit[1];

            for (const subModule of Object.keys(top.cells)) {
                if (subModule === hModule) {
                    for (const connection of Object.keys(top.cells[subModule].connections)) {
                        if (connection === hConnection) {
                            return arrayToBitstring(top.cells[subModule].connections[connection]);
                        }
                    }
                }
            }
        } else {
            for (const netname of Object.keys(top.netnames)) {
                if (netname === highlight) {
                    return arrayToBitstring(top.netnames[netname].bits);
                }
            }
        }
    } else {
        return highlight;
    }
}

export function dumpLayout(skinData: string, yosysNetlist: Yosys.Netlist, prelayout: boolean, done: ICallback) {
    const flatModule = createFlatModule(skinData, yosysNetlist);
    const kgraph: ElkModel.Graph = buildElkGraph(flatModule);
    if (prelayout) {
        done(null, JSON.stringify(kgraph, null, 2));
        return;
    }
    const layoutProps = Skin.getProperties();
    const promise = elk.layout(kgraph, { layoutOptions: layoutProps.layoutEngine });
    promise.then((graph: ElkModel.Graph) => {
        done(null, JSON.stringify(graph, null, 2));
    }).catch((reason) => {
        throw Error(reason);
    });
}

export function render(skinData: string, yosysNetlist: Yosys.Netlist, done?: ICallback, elkData?: ElkModel.Graph, highlight?: string) {
    const flatModule = createFlatModule(skinData, yosysNetlist);
    const kgraph: ElkModel.Graph = buildElkGraph(flatModule);
    const layoutProps = Skin.getProperties();
    const highlightId = getHighlightId(highlight, yosysNetlist);
    let promise;
    // if we already have a layout then use it
    if (elkData) {
        promise = new Promise((resolve) => {
            drawModule(elkData, flatModule, highlightId);
            resolve();
        });
    } else {
        // otherwise use ELK to generate the layout
        promise = elk.layout(kgraph, { layoutOptions: layoutProps.layoutEngine })
            .then((g) => drawModule(g, flatModule, highlightId))
            // tslint:disable-next-line:no-console
            .catch((e) => { console.error(e); });
    }

    // support legacy callback style
    if (typeof done === 'function') {
        promise.then((output: string) => {
            done(null, output);
            return output;
        }).catch((reason) => {
            throw Error(reason);
        });
    }
    return promise;
}
