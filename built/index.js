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
function createFlatModule(skinData, yosysNetlist) {
    Skin_1.default.skin = onml.p(skinData);
    var layoutProps = Skin_1.default.getProperties();
    var flatModule = new FlatModule_1.FlatModule(yosysNetlist);
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
        for (var _i = 0, _a = Object.keys(top.netnames); _i < _a.length; _i++) {
            var netname = _a[_i];
            if (netname === highlight) {
                return FlatModule_1.arrayToBitstring(top.netnames[netname].bits);
            }
        }
    }
    else {
        return highlight;
    }
}
function dumpLayout(skinData, yosysNetlist, prelayout, done) {
    var flatModule = createFlatModule(skinData, yosysNetlist);
    var kgraph = elkGraph_1.buildElkGraph(flatModule);
    if (prelayout) {
        done(null, JSON.stringify(kgraph, null, 2));
        return;
    }
    var layoutProps = Skin_1.default.getProperties();
    var promise = elk.layout(kgraph, { layoutOptions: layoutProps.layoutEngine });
    promise.then(function (graph) {
        done(null, JSON.stringify(graph, null, 2));
    }).catch(function (reason) {
        throw Error(reason);
    });
}
exports.dumpLayout = dumpLayout;
function render(skinData, yosysNetlist, done, elkData, highlight) {
    var flatModule = createFlatModule(skinData, yosysNetlist);
    var kgraph = elkGraph_1.buildElkGraph(flatModule);
    var layoutProps = Skin_1.default.getProperties();
    var highlightId = getHighlightId(highlight, yosysNetlist);
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
        promise = elk.layout(kgraph, { layoutOptions: layoutProps.layoutEngine })
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
