import * as vscode from "vscode";
import { GroupBy } from './groupBy/groupBy'
import { GroupByDuration } from "./groupBy/groupByDuration";
import { GroupByOutcome } from "./groupBy/groupByOutcome";
import { GroupByFile } from "./groupBy/groupByFile";

export class GroupByProvider {
    /**
     * The available groupby options
     */
    private items: Array<GroupBy> = new Array<GroupBy>();

    /**
     * The current selected item
     */
    private selected: GroupBy;

    constructor() {
        this.items.push(new GroupByOutcome());
        this.items.push(new GroupByDuration());
        this.items.push(new GroupByFile());
        
        this.selected = this.items[0];
    }

    /** 
     * Return the quick pick placeholder options 
     */
    getQuickPickOptions(): vscode.QuickPickOptions {
        return { placeHolder: "Select how you would like to group you test files" };
    }

    /** 
     * Show the quick pick options
     * @return the avilable quick pick options
     */
    show(): Promise<GroupBy> {

        return new Promise<GroupBy>((resolve, reject) => {
            vscode.window.showQuickPick<GroupBy>(this.items, this.getQuickPickOptions()).then((value: GroupBy) => {
                if (value != null) {
                    this.selected = value;
                }
                return resolve(this.selected);
            });
        });
    }

    /** 
     * Get the current selected group by filter
     * @return the selected groupby filter 
     */
    getSelected(): GroupBy {
        return this.selected;
    }
}