/**
 * Entrypoint into the tool.
 *
 * @license BSD, see LICENSE.md.
 */

import {CodeEditorPresenter} from "code_editor";
import {Compiler} from "compiler";
import {ReportDataWrapper} from "report_data";
import {ResultsPresenter} from "results";
import {UiEditorPresenter} from "ui_editor";
import {UiTranslatorCompiler} from "ui_translator";

const HELP_TEXT = "Would you like our help in resolving this issue?";

const WHITESPACE_REGEX = new RegExp("^\\s*$");
const NEW_FILE_MSG = [
  "Starting a new file will clear your current work.",
  "Do you want to to continue?",
].join(" ");

/**
 * Presenter controlling the main simluation buttons.
 *
 * Presenter which controls the functionality of the script and run button panel
 * in the UI which allow for basic tool functionality (switching authoring modes
 * and running the simulation).
 */
class ButtonPanelPresenter {
  /**
   * Creates a new ButtonPanelPresenter instance.
   *
   * @param {HTMLElement} root - The root element containing the button panel.
   * @param {Function} onBuild - Callback function triggered when build/run is initiated.
   */
  constructor(root, onBuild) {
    const self = this;
    self._root = root;

    self._availableDisplay = self._root.querySelector("#available-panel");
    self._loadingDisplay = self._root.querySelector("#loading");
    self._runButton = self._root.querySelector("#run-button");

    self._onBuild = onBuild;
    self._runButton.addEventListener("click", (run) => {
      self._onBuild(run);
    });

    self.enable();
  }

  /**
   * Enables the button panel and shows available options.
   */
  enable() {
    const self = this;
    self._availableDisplay.style.display = "block";
    self._loadingDisplay.style.display = "none";
  }

  /**
   * Disables the button panel and shows loading state.
   */
  disable() {
    const self = this;
    self._availableDisplay.style.display = "none";
    self._loadingDisplay.style.display = "block";
  }

  /**
   * Hides script-related buttons.
   */
  hideScriptButtons() {
    const self = this;
    self._runButton.style.display = "none";
  }

  /**
   * Shows script-related buttons.
   */
  showScriptButtons() {
    const self = this;
    self._runButton.style.display = "inline-block";
  }
}

/**
 * Main presenter class that coordinates the application's functionality.
 */
class MainPresenter {
  /**
   * Creates a new MainPresenter instance and initializes the application.
   */
  constructor() {
    const self = this;

    self._codeEditorPresenter = new CodeEditorPresenter(
      document.getElementById("code-editor"),
      () => self._onCodeChange(),
    );
    self._buttonPanelPresenter = new ButtonPanelPresenter(
      document.getElementById("code-buttons-panel"),
      () => self._onBuild(true),
    );
    self._resultsPresenter = new ResultsPresenter(document.getElementById("results"));

    self._uiEditorPresenter = new UiEditorPresenter(
      false,
      document.getElementById("editor-tabs"),
      document.getElementById("ui-editor-pane"),
      () => self._getCodeAsObj(),
      (codeObj) => self._onCodeObjUpdate(codeObj),
      () => self._codeEditorPresenter.forceUpdate(),
    );

    const source = localStorage.getItem("source");
    if (source) {
      self._codeEditorPresenter.setCode(source);
      const results = self._getCodeAsObj();
      if (results.getErrors().length > 0 || !results.getProgram().getIsCompatible()) {
        self._uiEditorPresenter.showCode();
      } else {
        self._uiEditorPresenter.forceCodeObj(results.getProgram());
      }
    }

    self._onCodeChange();
    self._setupFileButtons();
    self._setupWorkshopSample();
  }

  /**
   * Handles code change events and updates the UI accordingly.
   *
   * @private
   */
  _onCodeChange() {
    const self = this;
    const code = self._codeEditorPresenter.getCode();
    if (WHITESPACE_REGEX.test(code)) {
      self._buttonPanelPresenter.hideScriptButtons();
      self._uiEditorPresenter.refresh(null);
    } else {
      self._buttonPanelPresenter.showScriptButtons();
      self._onBuild(false);
    }
    localStorage.setItem("source", code);

    const encodedValue = encodeURI("data:text/qubectalk;charset=utf-8," + code);
    const saveButton = document.getElementById("save-file-button");
    saveButton.href = encodedValue;
  }

  /**
   * Handles build/run events and compiles/executes the code.
   *
   * @param {boolean} run - Flag indicating if to execute the code after
   *     compilation.
   * @param {boolean} resetFilters - Flag indicating if to reset the results
   *     UI filter values. Defaults to false if not given.
   * @private
   */
  _onBuild(run, resetFilters) {
    const self = this;
    self._buttonPanelPresenter.disable();

    if (resetFilters === undefined) {
      resetFilters = false;
    }

    const execute = () => {
      const compiler = new Compiler();
      const code = self._codeEditorPresenter.getCode();
      const result = compiler.compile(code);

      const compileErrors = result.getErrors();
      const hasErrors = compileErrors.length > 0;
      if (hasErrors) {
        self._codeEditorPresenter.showError(compileErrors[0]);
        self._buttonPanelPresenter.enable();
        return;
      } else {
        self._codeEditorPresenter.hideError();
      }

      const program = result.getProgram();
      if (result.getErrors().length > 0) {
        const message = "Program error: " + result.getErrors()[0];
        alertWithHelpOption(message);
        self._buttonPanelPresenter.enable();
        captureSentryMessage(message, "info");
        return;
      }

      if (result.getErrors().length > 0) {
        const message = "Result error: " + result.getErrors()[0];
        alertWithHelpOption(message);
        captureSentryMessage(message, "error");
        self._buttonPanelPresenter.enable();
        return;
      } else if (program !== null) {
        try {
          if (run) {
            const programResult = program();
            if (programResult.length == 0) {
              self._resultsPresenter.hide();
            } else {
              if (resetFilters) {
                self._resultsPresenter.resetFilter();
              }
              self._onResult(programResult);
            }
          }
        } catch (e) {
          console.log(e);
          alertWithHelpOption("On result error: " + e);
        }
      }
    };

    const executeSafe = () => {
      try {
        execute();
      } catch (e) {
        const message = "Execute error: " + e;
        alertWithHelpOption(message);
        captureSentryMessage(message, "error");
      }
      self._buttonPanelPresenter.enable();
    };

    setTimeout(executeSafe, 50);

    const codeObjResults = self._getCodeAsObj();
    if (codeObjResults.getErrors() == 0) {
      const codeObj = codeObjResults.getProgram();

      if (self._uiEditorPresenter !== null) {
        self._uiEditorPresenter.refresh(codeObj);
      }
    }
  }

  /**
   * Handles program execution results and displays them.
   *
   * @param {Object} results - The results of program execution.
   * @private
   */
  _onResult(results) {
    const self = this;
    const resultsWrapped = new ReportDataWrapper(results);
    self._resultsPresenter.showResults(resultsWrapped);
  }

  /**
   * Gets the code as an object representation.
   *
   * @param {string} [overrideCode] - Optional code to use instead of editor content.
   * @returns {Object} The compiled code object.
   * @private
   */
  _getCodeAsObj(overrideCode) {
    const self = this;
    const code = overrideCode === undefined ? self._codeEditorPresenter.getCode() : overrideCode;
    const compiler = new UiTranslatorCompiler();
    const result = compiler.compile(code);
    return result;
  }

  /**
   * Handles code object updates and refreshes the UI.
   *
   * @param {Object} codeObj - The updated code object.
   * @private
   */
  _onCodeObjUpdate(codeObj) {
    const self = this;
    const newCode = codeObj.toCode(0);
    self._codeEditorPresenter.setCode(newCode);

    if (self._uiEditorPresenter !== null) {
      self._uiEditorPresenter.refresh(codeObj);
    }

    if (codeObj.getScenarios() == 0) {
      self._resultsPresenter.hide();
      return;
    }

    self._onBuild(true);
  }

  /**
   * Sets up file-related button handlers.
   *
   * @private
   */
  _setupFileButtons() {
    const self = this;

    const loadFileDialog = document.getElementById("load-file-dialog");

    const setCode = (code, resetFilters) => {
      self._codeEditorPresenter.setCode(code);
      self._onCodeChange();
      self._onBuild(true, resetFilters);
    };

    const newFileDialog = document.getElementById("new-file-button");
    newFileDialog.addEventListener("click", (event) => {
      event.preventDefault();
      if (confirm(NEW_FILE_MSG)) {
        setCode("");
      }
    });

    const loadFileButton = document.getElementById("load-file-button");
    loadFileButton.addEventListener("click", (event) => {
      event.preventDefault();
      loadFileDialog.showModal();
    });

    const cancelButton = loadFileDialog.querySelector(".cancel-button");
    cancelButton.addEventListener("click", (event) => {
      event.preventDefault();
      loadFileDialog.close();
    });

    const loadButton = loadFileDialog.querySelector(".load-button");
    loadButton.addEventListener("click", (event) => {
      event.preventDefault();

      const file = loadFileDialog.querySelector(".upload-file").files[0];
      if (file) {
        const reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = (event) => {
          const newCode = event.target.result;
          setCode(newCode, true);
          self._uiEditorPresenter.enableAllSections();
          loadFileDialog.close();
        };
      }
    });
  }

  /**
   * Sets up workshop sample button functionality.
   *
   * @private
   */
  _setupWorkshopSample() {
    const self = this;
    const button = document.getElementById("workshop-sample-button");
    button.addEventListener("click", () => {
      if (confirm("This will clear you current analysis. Do you want to continue?")) {
        const code = document.getElementById("workshop-sample").innerHTML;
        self._codeEditorPresenter.setCode(code);
        self._onCodeChange();
        self._uiEditorPresenter.showCode();
      }
    });
  }
}

/**
 * Main entry point for the application.
 */
function main() {
  const showApp = () => {
    document.getElementById("loading").style.display = "none";
    document.getElementById("main-holder").style.display = "block";
  };

  const onLoad = () => {
    const mainPresenter = new MainPresenter();
    setTimeout(showApp, 500);
  };

  setTimeout(onLoad, 500);
}

/**
 * Show the user an alert and offer help.
 *
 * Show the user an alert to the user with the given message as a confirm
 * dialog. HELP_TEXT will be added to the end. If the user says OK, then
 * they will be redirected to /guide/get_help.html
 *
 * @param message {string} - The message to display.
 */
function alertWithHelpOption(message) {
  if (confirm(message + " " + HELP_TEXT)) {
    window.location.href = "/guide/get_help.html";
  }
}

/**
 * Send a report of an issue to Sentry if enabled.
 */
function captureSentryMessage(message, level) {
  console.log("Sentry message not sent.", message, level);
}

export {main};
