import { getEles } from "../getEles";
import { IActionArgs, UndoRedoAction } from "./undoRedo";

export interface ISelectAction extends IActionArgs {
    startSelect: string;
    endSelect: string;
}
export class SelectAction extends UndoRedoAction<ISelectAction> {
    private cy?: Cy.Core;
    constructor(
        private readonly onSelect: (ele: Cy.CollectionElements) => void,
        private readonly onUnselect: (ele: Cy.CollectionElements) => void,
    ) {
        super("select");
    }
    public do({ startSelect, endSelect }: ISelectAction): void {
        this.unselect(startSelect);
        this.select(endSelect);
    }
    public undo({ startSelect, endSelect }: ISelectAction): void {
        this.unselect(endSelect);
        this.select(startSelect);
    }
    public attach(cy: Cy.Core) {
        this.detach();
        this.cy = cy;
    }
    public detach() {
        this.cy = undefined;
    }
    private select(id: string): void {
        if (!id || !this.cy) {
            return;
        }
        const ele = getEles(
            this.cy.elements(),
            (e) => e.id() === id,
        );
        if (ele.isNode()) {
            this.addNodeEdgeHighlights(ele as Cy.NodeCollection);
        }
        ele.selectify();
        ele.select();
        ele.unselectify();
        this.onSelect(ele);
    }
    private addNodeEdgeHighlights(node: Cy.NodeCollection) {
        node.incomers().edges("").addClass("incoming");
        node.outgoers().edges("").addClass("outgoing");
    }
    private unselect(id: string): void {
        if (!id || !this.cy) {
            return;
        }
        const ele = getEles(
            this.cy.elements(),
            (e) => e.id() === id,
        );
        if (ele.isNode()) {
            this.removeNodeEdgeHighlights(ele as Cy.NodeCollection);
        }
        ele.selectify();
        ele.unselect();
        ele.unselectify();
        this.onUnselect(ele);
    }
    private removeNodeEdgeHighlights(node: Cy.NodeCollection) {
        node.incomers().edges("").removeClass("incoming");
        node.outgoers().edges("").removeClass("outgoing");
    }
}
