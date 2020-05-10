'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var ELK = require("elkjs");
var onml = require("onml");
var _ = require("lodash");
var FlatModule_1 = require("./FlatModule");
var Skin_1 = require("./Skin");
var elkGraph_1 = require("./elkGraph");
var drawModule_1 = require("./drawModule");
var elk = new ELK();
function getHighlightId(highlight, yosysNetlist) {
    if (highlight) {
        var moduleName_1;
        _.forEach(yosysNetlist.modules, function (mod, name) {
            if (mod.attributes && mod.attributes.top === 1) {
                moduleName_1 = name;
            }
        });
        if (moduleName_1 == null) {
            moduleName_1 = Object.keys(yosysNetlist.modules)[0];
        }
        var top = yosysNetlist.modules[moduleName_1];
        if (highlight.includes(' ')) {
            var highlightSplit = highlight.split(' ');
            var hModule = highlightSplit[0];
            var hConnection = highlightSplit[1];
            for (var _i = 0, _a = Object.keys(top.cells); _i < _a.length; _i++) {
                var subModule = _a[_i];
                if (subModule === hModule) {
                    for (var _b = 0, _c = Object.keys(top.cells[subModule].connections); _b < _c.length; _b++) {
                        var connection = _c[_b];
                        if (connection === hConnection) {
                            return FlatModule_1.arrayToBitstring(top.cells[subModule].connections[connection]);
                        }
                    }
                }
            }
        }
        else {
            for (var _d = 0, _e = Object.keys(top.netnames); _d < _e.length; _d++) {
                var netname = _e[_d];
                if (netname === highlight) {
                    return FlatModule_1.arrayToBitstring(top.netnames[netname].bits);
                }
            }
        }
    }
    else {
        return highlight;
    }
}
function render(skinData, yosysNetlist, done, elkData, configData) {
    var skin = onml.p(skinData);
    Skin_1.default.skin = skin;
    var flatModule = FlatModule_1.FlatModule.fromNetlist(yosysNetlist, configData);
    var kgraph = elkGraph_1.buildElkGraph(flatModule);
    var highlightId = '';
    var promise;
    // if we already have a layout then use it
    if (elkData) {
        promise = new Promise(function (resolve) {
            drawModule_1.default(elkData, flatModule, highlightId);
            resolve();
        });
    }
    else {
        // otherwise use ELK to generate the layout
        promise = elk.layout(kgraph, { layoutOptions: FlatModule_1.FlatModule.layoutProps.layoutEngine })
            .then(function (g) { return drawModule_1.default(g, flatModule, highlightId); })
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
