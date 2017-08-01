
import { remote } from "electron";
import * as fs from "fs";
import * as path from "path";
import { computeDiagramForFile } from "../diagram/computeDiagram";
import { getInfoPaneState, registerInfoPane } from "./ElementInfo";
import { registerGraph } from "./graphActions";
import { getCurrentFilterState, IInitialGraphFilterState, registerFilterPane } from "./GraphFilter";
import {
    applyLayout,
    boxGridLayout,
    getPositions,
    INodePositions,
    presetLayout,
} from "./Layouts";
import { getCyStyle } from "./style";
import { redo, undo } from "./undoRedo";

const fileExtension = "tsgraph.json";
const fileFilters: Electron.FileFilter[] = [{
    name: "Typescript Graphs",
    extensions: [fileExtension],
}];

interface ISaveData {
    fileFormatVersion: number;
    elements: Cy.ElementDefinition[];
    positions: INodePositions;
    filePath: string;
    infoPanelState: string;
    filterPanelState: IInitialGraphFilterState;
}

function getElements(cy: Cy.Core): Cy.ElementDefinition[] {
    const elements: Cy.ElementsDefinition = (cy.json() as Cy.CytoscapeOptions).elements as any;
    return [...elements.nodes, ...elements.edges].map((e) => ({ data: e.data }));
}
function saveGraph(filePath: string, cy: Cy.Core) {
    const saveData: ISaveData = {
        fileFormatVersion: 1,
        elements: getElements(cy),
        positions: getPositions(cy.nodes()),
        infoPanelState: getInfoPaneState(),
        filterPanelState: getCurrentFilterState(),
        filePath,
    };
    const baseFileName = path.basename(filePath).match(/^(.*?)(.tsx?)?$/)[1];
    const defaultPath = `${baseFileName}.${fileExtension}`;
    remote.dialog.showSaveDialog({
        filters: fileFilters,
        defaultPath,
    }, (fileName) => {
        fs.writeFile(fileName, JSON.stringify(saveData), (err) => {
            // tslint:disable-next-line:no-console
            console.log("error", err);
        });
    });
}
function loadGraph() {
    remote.dialog.showOpenDialog({
        filters: fileFilters,
    }, ([filePath]) => {
        if (!filePath) {
            return;
        }
        fs.readFile(filePath, (err, buffer: Buffer) => {
            // tslint:disable-next-line:no-console
            console.log(err);
            const dataStr = buffer.toString("utf-8");
            const data: ISaveData = JSON.parse(dataStr);
            const cy = updateUI(data);
            applyLayout(cy.nodes(), presetLayout(data.positions));
        });
    });
}
function setMenuItems(filePath: string, cy: Cy.Core) {
    const menu = remote.Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [
                {
                    label: "Save",
                    accelerator: "CommandOrControl+S",
                    click: () => saveGraph(filePath, cy),
                },
                {
                    label: "Open",
                    accelerator: "CommandOrControl+O",
                    // tslint:disable-next-line:no-console
                    click: () => loadGraph(),
                },
            ],
        },
        {
            label: "View",
            submenu: [
                { role: "togglefullscreen" },
                { role: "reload" },
                { role: "toggledevtools" },
                {
                    label: "Reset Layout",
                    accelerator: "Alt+E",
                    click: () => applyDefaultLayout(cy),
                },
                {
                    label: "Re-Compile",
                    accelerator: "Alt+C",
                    click: () => loadInitial(filePath),
                },
            ],
        },
        {
            label: "Edit",
            submenu: [
                {
                    label: "Undo",
                    accelerator: "CommandOrControl+Z",
                    click: () => undo(),
                },
                {
                    label: "Redo",
                    accelerator: "CommandOrControl+Y",
                    click: () => redo(),
                },
            ],
        },
    ]);
    remote.getCurrentWindow().setMenu(menu);
}
function updateWindowTitle(status: string) {
    remote.getCurrentWindow().setTitle(status);
}

function applyDefaultLayout(cy: Cy.Core) {
    const currentTitle = remote.getCurrentWindow().getTitle();
    updateWindowTitle("Computing layout...");
    applyLayout(cy.nodes(), boxGridLayout(cy.nodes()));
    updateWindowTitle(currentTitle);
}
function registerUndoRedo(cy: Cy.Core) {
    registerGraph(cy);
}
function updateUI(
    {
        filePath,
        filterPanelState,
        infoPanelState,
        elements,
    }: ISaveData,
): Cy.Core {
    updateWindowTitle("Drawing graph...");
    const cy = cytoscape({
        container: $("#cy")[0], elements,
        boxSelectionEnabled: false,
        selectionType: "additive",
        style: getCyStyle(),
        layout: { name: "null" } as Cy.NullLayoutOptions,
    });
    setMenuItems(filePath, cy);
    registerInfoPane(cy, infoPanelState);
    registerFilterPane(cy, filterPanelState);
    registerUndoRedo(cy);
    updateWindowTitle(`${path.basename(filePath)} UML`);
    return cy;
}
function loadInitial(filePath: string) {
    const elements: Cy.ElementDefinition[] = computeDiagramForFile(filePath, updateWindowTitle);
    const cy = updateUI({
        elements,
        filePath,
        filterPanelState: { showFilter: false, types: {} },
        infoPanelState: "",
    } as ISaveData);
    applyDefaultLayout(cy);
}

remote.getCurrentWindow().setMenu(remote.Menu.buildFromTemplate([
    { role: "toggledevtools" },
]));
loadInitial(remote.getGlobal("diagramArgs")[3]);
