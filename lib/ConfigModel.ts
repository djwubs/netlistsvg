interface Config {
    hierarchy: Hierarchy;
    top: Top;
    highlight: Highlight;
}

interface Hierarchy {
    enable: 'off' | 'level' | 'all' | 'modules';
    expandLevel: number;
    expandModules: ExpandModules;
    colour: string[];
}

interface ExpandModules {
    types: string[];
    ids: string[];
}

interface Top {
    enable: boolean;
    module: string;
}

interface Highlight {
    enable: boolean;
    ports: string[][];
}

export default Config;
