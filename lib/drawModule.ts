import { ElkModel } from './elkGraph';
import { FlatModule, removeDups } from './FlatModule';
import Cell from './Cell';
import Skin from './Skin';

import _ = require('lodash');
import onml = require('onml');
import assert = require('assert');

enum WireDirection {
    Up, Down, Left, Right,
}

export default function drawModule(g: ElkModel.Graph, module: FlatModule, highlightIds: string[][]) {
    const nodes: onml.Element[] = module.nodes.map((n: Cell) => {
        const kchild: ElkModel.Cell = _.find(g.children, (c) => c.id === n.parent + '.' + n.Key);
        return n.render(kchild, highlightIds);
    });
    removeDummyEdges(g);
    let lines: onml.Element[] = _.flatMap(g.edges, (e: ElkModel.Edge) => {
        const netId = ElkModel.wireNameLookup[e.id];
        const netName = 'net_' + netId.slice(1, netId.length - 1);
        return _.flatMap(e.sections, (s: ElkModel.Section) => {
            let startPoint = s.startPoint;
            s.bendPoints = s.bendPoints || [];
            let bends: any[] = s.bendPoints.map((b) => {
                const l = ['line', {
                    x1: startPoint.x,
                    x2: b.x,
                    y1: startPoint.y,
                    y2: b.y,
                    class: netName,
                    'stroke-linecap': 'round',
                }];
                startPoint = b;
                return l;
            });
            if (e.junctionPoints) {
                const circles: any[] = e.junctionPoints.map((j: ElkModel.WirePoint) =>
                    ['circle', {
                        cx: j.x,
                        cy: j.y,
                        r: 2,
                        class: netName,
                        fill: 'black',
                    }]);
                bends = bends.concat(circles);
            }
            const line = [['line', {
                x1: startPoint.x,
                x2: s.endPoint.x,
                y1: startPoint.y,
                y2: s.endPoint.y,
                class: netName,
                'stroke-linecap': 'round',
            }]];
            return bends.concat(line);
        });
    });
    lines.sort((a, b) => {
        return ('' + a[1].class).localeCompare(b[1].class);
    });
    const newLines = new Array();
    let lastNetName: string;
    let pos = -1;
    for (const line of lines) {
        if (line[1].class !== lastNetName) {
            let bus = '';
            if (line[1].class.includes(',', 3)) {
                bus = ' bus';
            }
            newLines.push(['g', {class: line[1].class.concat(bus)}]);
            pos += 1;
            lastNetName = line[1].class;
        }
        if (line[1].class.includes(',', 3)) {
            line[1]['stroke-width'] = '2';
        }
        if (highlightIds) {
            if (_.some(highlightIds, (a) => [module.moduleName, line[1].class.slice(4)].every((v, i) => v === a[i])))  {
                line[1]['stroke-width'] = '2';
                line[1].stroke = 'red';
                line[1].fill = 'red';
            }
        }
        newLines[pos].push(line);
    }
    lines = newLines;

    const svgAttrs: onml.Attributes = Skin.skin[1];
    svgAttrs.width = g.width.toString();
    svgAttrs.height = g.height.toString();

    const styles: onml.Element = ['style', {}, ''];
    onml.t(Skin.skin, {
        enter: (node) => {
            if (node.name === 'style') {
                styles[2] += node.full[2];
            }
        },
    });
    const elements: onml.Element[] = [styles, ...nodes, ...lines];
    const ret: onml.Element = ['svg', svgAttrs, ...elements];
    return onml.s(ret);
}

export function drawSubModule(c: ElkModel.Cell, subModule: FlatModule, highlightIds: string[][]) {
    const nodes: onml.Element[] = [];
    _.forEach(subModule.nodes, (n: Cell) => {
        const kchild: ElkModel.Cell = _.find(c.children, (child) => child.id === n.parent + '.' + n.Key);
        if (kchild) {
            nodes.push(n.render(kchild, highlightIds));
        }
    });
    removeDummyEdges(c);
    let lines: onml.Element[] = _.flatMap(c.edges, (e: ElkModel.Edge) => {
        const netId = ElkModel.wireNameLookup[e.id];
        const netName = 'net_' + netId.slice(1, netId.length - 1);
        return _.flatMap(e.sections, (s: ElkModel.Section) => {
            let startPoint = s.startPoint;
            s.bendPoints = s.bendPoints || [];
            let bends: any[] = s.bendPoints.map((b) => {
                const l = ['line', {
                    x1: startPoint.x,
                    x2: b.x,
                    y1: startPoint.y,
                    y2: b.y,
                    class: netName,
                }];
                startPoint = b;
                return l;
            });
            if (e.junctionPoints) {
                const circles: any[] = e.junctionPoints.map((j: ElkModel.WirePoint) =>
                    ['circle', {
                        cx: j.x,
                        cy: j.y,
                        r: 2,
                        fill: 'black',
                        class: netName,
                    }]);
                bends = bends.concat(circles);
            }
            const line = [['line', {
                x1: startPoint.x,
                x2: s.endPoint.x,
                y1: startPoint.y,
                y2: s.endPoint.y,
                class: netName,
            }]];
            return bends.concat(line);
        });
    });
    lines.sort((a, b) => {
        return ('' + a[1].class).localeCompare(b[1].class);
    });
    const newLines = new Array();
    let lastNetName: string;
    let pos = -1;
    for (const line of lines) {
        if (line[1].class !== lastNetName) {
            let bus = '';
            if (line[1].class.includes(',', 3)) {
                bus = ' bus';
            }
            newLines.push(['g', {class: line[1].class.concat(bus)}]);
            pos += 1;
            lastNetName = line[1].class;
        }
        if (line[1].class.includes(',', 3)) {
            line[1]['stroke-width'] = '2';
        }
        if (highlightIds) {
            if (_.some(highlightIds, (a) => [subModule.moduleName, line[1].class.slice(4)].every((v, i) => v === a[i])))  {
                line[1]['stroke-width'] = '2';
                line[1].stroke = 'red';
                line[1].fill = 'red';
            }
        }
        newLines[pos].push(line);
    }
    lines = newLines;

    const svgAttrs: onml.Attributes = Skin.skin[1];
    svgAttrs.width = c.width.toString();
    svgAttrs.height = c.height.toString();

    const elements: onml.Element[] = [...nodes, ...lines];
    const ret: onml.Element = ['svg', svgAttrs, ...elements];
    return ret;
}

function which_dir(start: ElkModel.WirePoint, end: ElkModel.WirePoint): WireDirection {
    if (end.x === start.x && end.y === start.y) {
        throw new Error('start and end are the same');
    }
    if (end.x !== start.x && end.y !== start.y) {
        throw new Error('start and end arent orthogonal');
    }
    if (end.x > start.x) {
        return WireDirection.Right;
    }
    if (end.x < start.x) {
        return WireDirection.Left;
    }
    if (end.y > start.y) {
        return WireDirection.Down;
    }
    if (end.y < start.y) {
        return WireDirection.Up;
    }
    throw new Error('unexpected direction');
}

function findBendNearDummy(
        net: ElkModel.Edge[],
        dummyIsSource: boolean,
        dummyLoc: ElkModel.WirePoint): ElkModel.WirePoint {
    const candidates = net.map( (edge) => {
        const bends = edge.sections[0].bendPoints || [null];
        if (dummyIsSource) {
            return _.first(bends);
        } else {
            return _.last(bends);
        }
    }).filter((p) => p !== null);
    return _.minBy(candidates, (pt: ElkModel.WirePoint) => {
        return Math.abs(dummyLoc.x - pt.x) + Math.abs(dummyLoc.y - pt.y);
    });
}

export function removeDummyEdges(g: ElkModel.Graph|ElkModel.Cell) {
    // go through each edge group for each dummy
    let dummyNum: number = 0;
    // loop until we can't find an edge group or we hit 10,000
    while (dummyNum < 10000) {
        const dummyId: string = '$d_' + String(dummyNum);
        // find all edges connected to this dummy
        const edgeGroup = _.filter(g.edges, (e: ElkModel.Edge) => {
            return e.source === dummyId || e.target === dummyId;
        });
        if (edgeGroup.length === 0) {
            break;
        }
        let dummyIsSource: boolean;
        let dummyLoc: ElkModel.WirePoint;
        const firstEdge: ElkModel.Edge = edgeGroup[0] as ElkModel.Edge;
        if (firstEdge.source === dummyId) {
            dummyIsSource = true;
            dummyLoc = firstEdge.sections[0].startPoint;
        } else {
            dummyIsSource = false;
            dummyLoc = firstEdge.sections[0].endPoint;
        }
        const newEnd: ElkModel.WirePoint = findBendNearDummy(edgeGroup as ElkModel.Edge[], dummyIsSource, dummyLoc);
        for (const edge of edgeGroup) {
            const e: ElkModel.Edge = edge as ElkModel.Edge;
            const section = e.sections[0];
            if (dummyIsSource) {
                section.startPoint = newEnd;
                if (section.bendPoints) {
                    section.bendPoints.shift();
                }
            } else {
                section.endPoint = newEnd;
                if (section.bendPoints) {
                    section.bendPoints.pop();
                }
            }
        }
        // delete junction point if necessary
        const directions = new Set(_.flatMap(edgeGroup, (edge: ElkModel.Edge) => {
            const section = edge.sections[0];
            if (dummyIsSource) {
                // get first bend or endPoint
                if (section.bendPoints && section.bendPoints.length > 0) {
                    return [section.bendPoints[0]];
                }
                return section.endPoint;
            } else {
                if (section.bendPoints && section.bendPoints.length > 0) {
                    return [_.last(section.bendPoints)];
                }
                return section.startPoint;
            }
        }).map( (pt) => {
            if (pt.x > newEnd.x) {
                return WireDirection.Right;
            }
            if (pt.x < newEnd.x) {
                return WireDirection.Left;
            }
            if (pt.y > newEnd.y) {
                return WireDirection.Down;
            }
            return WireDirection.Up;
        }));
        if (directions.size < 3) {
            // remove junctions at newEnd
            edgeGroup.forEach((edge: ElkModel.Edge) => {
                if (edge.junctionPoints) {
                    edge.junctionPoints = edge.junctionPoints.filter((junct) => {
                        return !_.isEqual(junct, newEnd);
                    });
                }
            });
        }
        dummyNum += 1;
    }
}
