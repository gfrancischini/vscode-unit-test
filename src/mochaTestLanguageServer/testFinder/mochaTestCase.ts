import { TestCase } from "../../testLanguage/protocol";

export class MochaTestCase extends TestCase {
    type: string;
}

export class SuiteItem extends MochaTestCase {
    constructor() {
        super();
        this.type = "suite";
    }
}

export class DescribeItem extends MochaTestCase {
    constructor() {
        super();
        this.type = "describe";
    }
}

export class TestItem extends MochaTestCase {
    constructor() {
        super();
        this.type = "test";
    }
}

export class ItItem extends MochaTestCase {
    constructor() {
        super();
        this.type = "it";
    }
}

type Item = SuiteItem | DescribeItem | ItItem | TestItem;