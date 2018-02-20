# WORK IN PROGRESS 

# Visual Studio Code Unit Test Tree View for JS

## Sections

[List of Features](##Features)<br>
[How to Configure](##Extension-Settings)
[Build](##Build)
[Contribution](##Contribute)

## Quick Overview

Discover tests, Run specific tests, Inspect results, Debug, Open test location.

![Alt Text](resources/functionalities.gif)

## Features

### Run tests in Test Explorer

When the extension is enabled it will automatically open the Test Explorer. All tests that have been discovered will show on the Test Explorer just like on the image below

![Alt Text](resources/doc/testExplorer1.png)

As you run, write, and rerun your tests, Test Explorer displays the results in default groups depending upon your selected group by filter.
### Group By - Group Test by Outcome, Duration or File

* Outcome - Tests are grouped by - **Failed Tests**, **Passed Tests** and **Skipped Tests**
* Duration - Tests are grouped by - **Slow**, **Medium** and **Fast**
* File - Tests are grouped by **File Name**

### Run tests
You can run all the tests in the solution, all the tests in a group, or a set of tests that you select. Do one of the following:

* To run all the tests in a solution, click on the **...** and choose **Run All**.
* To run a specific test select the test and click on **Run**. You can also right click the test and select **Run Selected Test Case**
* To run a specific group of test select the test group and click on **Run** You can also right click the test group and select **Run Selected Test Group**

### View test results

As you run, write, and rerun your tests, Test Explorer is automatically updated and displays the results using color code icons. To view more details about the test just click on the test and the **Test Result** output pane will open showing the test results.

**Show Selected Test Results**
![Alt Text](resources/doc/showSelectedTestResult.png)

The result will be displayed on the **output window**
![Alt Text](resources/doc/outputSelectedTestResult.png)


### View the source code of a test method
To display the source code for a test method in the Visual Studio Code editor you only need to left click the test. 


## Requirements

NodeJS > 8.6 for Running Mocha Tests

## Extension Settings

This extension contributes the following settings:

* `mocha.glob`: Mocha Glob pattern used to find test files
* `mocha.opts`: Mocha Opts Path Relative path to the workspace

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 0.0.1

Beta Initial release 


-----------------------------------------------------------------------------------------------------------

## Contribute

Interested in contributing to this project? Check out below the ways to contribute and make this project better.

* Submit a bug report or feature suggestion through the GitHub Issue Tracker
* Review the source code changes
* Submit a code fix for a bug


## Build
To build the extension, run the following command from the root of the repository:

`npm build`

This command will create the out\src and out\test folders at the root of the repository.