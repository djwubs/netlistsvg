'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = void 0;
var ELK = require("elkjs");
var onml = require("onml");
var FlatModule_1 = require("./FlatModule");
var Skin_1 = require("./Skin");
var elkGraph_1 = require("./elkGraph");
var drawModule_1 = require("./drawModule");
var elk = new ELK();
function getHighlightIds(highlight, yosysNetlist, flatModule) {
    var top = yosysNetlist.modules[flatModule.moduleName];
    var highlightIds = [];
    for (var _i = 0, highlight_1 = highlight; _i < highlight_1.length; _i++) {
        var h = highlight_1[_i];
        if (h[0] === flatModule.moduleName && h.length === 2) {
            for (var _a = 0, _b = Object.keys(top.netnames); _a < _b.length; _a++) {
                var netname = _b[_a];
                if (netname === h[1]) {
                    highlightIds.push([h[0], FlatModule_1.arrayToBitstring(top.netnames[netname].bits)]);
                }
            }
        }
        else if (h[0] === flatModule.moduleName && h.length > 2) {
            var peak = top;
            for (var i = 1; i < h.length - 2; i++) {
                var type = peak.cells[h[i]].type;
                peak = yosysNetlist.modules[type];
            }
            for (var _c = 0, _d = Object.keys(peak.cells[h[h.length - 2]].connections); _c < _d.length; _c++) {
                var conn = _d[_c];
                if (conn === h[h.length - 1]) {
                    highlightIds.push([h[h.length - 2], FlatModule_1.arrayToBitstring(peak.cells[h[h.length - 2]].connections[conn])]);
                }
            }
        }
    }
    return highlightIds;
}
function render(skinData, yosysNetlist, done, elkData, configData) {
    var skin = onml.p(skinData);
    Skin_1.default.skin = skin;
    var flatModule = FlatModule_1.FlatModule.fromNetlist(yosysNetlist, configData);
    var kgraph = elkGraph_1.buildElkGraph(flatModule);
    var highlightIds = null;
    if (configData.highlight.enable === true) {
        highlightIds = getHighlightIds(configData.highlight.ports, yosysNetlist, flatModule);
    }
    var promise;
    // if we already have a layout then use it
    if (elkData) {
        promise = new Promise(function (resolve) {
            drawModule_1.default(elkData, flatModule, highlightIds);
            resolve();
        });
    }
    else {
        // otherwise use ELK to generate the layout
        promise = elk.layout(kgraph, { layoutOptions: FlatModule_1.FlatModule.layoutProps.layoutEngine })
            .then(function (g) { return drawModule_1.default(g, flatModule, highlightIds); })
            // tslint:disable-next-line:no-console
            .catch(function (e) { console.error(e); });
    }
    // support legacy callback style
    if (typeof done === 'function') {
        promise.then(function (output) {
            done(null, output);
            return output;
        }).catch(function (reason) {
            throw Error(reason);
        });
    }
    return promise;
}
exports.render = render;
