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

function getHighlightIds(highlight: string[][], yosysNetlist: Yosys.Netlist, flatModule: FlatModule): string[] {
    const top = yosysNetlist.modules[flatModule.moduleName];
    const highlightIds = [];

    for (const h of highlight) {
        if (h[0] === flatModule.moduleName && h.length === 2) {
            for (const netname of Object.keys(top.netnames)) {
                if (netname === h[1]) {
                    highlightIds.push([h[0], arrayToBitstring(top.netnames[netname].bits)]);
                }
            }
        } else if (h[0] === flatModule.moduleName && h.length > 2) {
            let peak = top;
            for (let i = 1; i < h.length - 2; i++) {
                const type = peak.cells[h[i]].type;
                peak = yosysNetlist.modules[type];
            }
            for (const conn of Object.keys(peak.cells[h[h.length - 2]].connections)) {
                if (conn === h[h.length - 1]) {
                    highlightIds.push([h[h.length - 2], arrayToBitstring(peak.cells[h[h.length - 2]].connections[conn])]);
                }
            }
        }
    }
    return highlightIds;
}

export function render(skinData: string, yosysNetlist: Yosys.Netlist,
                       done?: ICallback, elkData?: ElkModel.Graph, configData?: Config) {
    const skin = onml.p(skinData);
    Skin.skin = skin;
    const flatModule = FlatModule.fromNetlist(yosysNetlist, configData);
    const kgraph: ElkModel.Graph = buildElkGraph(flatModule);
    let highlightIds = null;

    if (configData.highlight.enable === true) {
        highlightIds = getHighlightIds(configData.highlight.ports, yosysNetlist, flatModule);
    }

    let promise;
    // if we already have a layout then use it
    if (elkData) {
        promise = new Promise((resolve) => {
            drawModule(elkData, flatModule, highlightIds);
            resolve();
        });
    } else {
        // otherwise use ELK to generate the layout
        promise = elk.layout(kgraph, { layoutOptions: FlatModule.layoutProps.layoutEngine })
            .then((g) => drawModule(g, flatModule, highlightIds))
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
