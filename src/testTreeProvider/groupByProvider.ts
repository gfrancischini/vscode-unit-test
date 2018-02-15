import * as vscode from "vscode";
import { GroupBy } from './groupBy/groupBy'
import { GroupByDuration } from "./groupBy/groupByDuration";
import { GroupByOutcome } from "./groupBy/groupByOutcome";

export class GroupByProvider {
    private items: Array<GroupBy> = new Array<GroupBy>();

    private selected: GroupBy;

    constructor() {
        //const groupByOutcome = new GroupByQuickPickItem(GroupByQuickPickItemType.Outcome, "Outcome", "Groups tests by execution results: Failed Tests, Skipped Tests, Passed Tests.")
        //this.items.push(groupByOutcome);
        //this.items.push(new GroupByQuickPickItem(GroupByQuickPickItemType.Duration, "Duration", "Groups test by execution time: Fast, Medium, and Slow."));
        //this.items.push(new GroupByQuickPickItem(GroupByQuickPickItemType.Class, "Class", "Groups tests by method class"));

        this.items.push(new GroupByOutcome());
        this.items.push(new GroupByDuration());
        
        this.selected = this.items[0];
    }

    getQuickPickOptions(): vscode.QuickPickOptions {
        return { placeHolder: "Select how you would like to group you test files" };
    }

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

    getSelected(): GroupBy {
        return this.selected;
    }




}