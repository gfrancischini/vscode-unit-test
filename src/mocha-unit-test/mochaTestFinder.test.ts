import { MochaTestFinder } from './mochaTestFinder'

it('throw file not found exception when file does not exists', () => {
    MochaTestFinder.findTestCases("wrong file path");
});
