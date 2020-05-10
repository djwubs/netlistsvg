'use strict';

import ELK = require('elkjs');
import onml = require('onml');
import _ = require('lodash');
import { FlatModule, arrayToBitstring } from './FlatModule';
import Yosys from './YosysModel';
import Config from './ConfigModel';
import Skin from './Skin';
import { ElkModel, buildElkGraph } from './elkGraph';
import drawModule from './drawModule';

const elk = new ELK();

type ICallback = (error: Error, result?: string) => void;

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

export function render(skinData: string, yosysNetlist: Yosys.Netlist,
                       done?: ICallback, elkData?: ElkModel.Graph, configData?: Config) {
    const skin = onml.p(skinData);
    Skin.skin = skin;
    const flatModule = FlatModule.fromNetlist(yosysNetlist, configData);
    const kgraph: ElkModel.Graph = buildElkGraph(flatModule);
    const highlightId = '';

    let promise;
    // if we already have a layout then use it
    if (elkData) {
        promise = new Promise((resolve) => {
            drawModule(elkData, flatModule, highlightId);
            resolve();
        });
    } else {
        // otherwise use ELK to generate the layout
        promise = elk.layout(kgraph, { layoutOptions: FlatModule.layoutProps.layoutEngine })
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
