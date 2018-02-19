import { TestCase, TestCaseStatus } from '../testLanguage/protocol';
import { TreeLabel } from "./treeLabel"

/**
 * Type that the tree provider handles
 */
export type TestTreeType = TreeLabel | TestCase;