/**
 * Presenters and logic to visualize engine result.
 *
 * @license BSD, see LICENSE.md.
 */
import {EngineNumber} from "engine_number";
import {FilterSet} from "user_config";

/**
 * Array of colors used for visualizations
 * @type {string[]}
 */
const COLORS = [
  "#a6cee3",
  "#1f78b4",
  "#b2df8a",
  "#33a02c",
  "#fb9a99",
  "#e31a1c",
  "#505050",
  "#A0A0A0",
];

/**
 * Flag to allow an "All" option in filters to make it easy to return to a
 * default state.
 *
 * @type {boolean}
 */
const ALLOW_REDUNDANT_ALL = true;

/**
 * Flag to indicate if large score displays are active.
 *
 * @type {boolean}
 */
const ALLOW_SCORE_DISPLAY = false;

/**
 * Get a color from the predefined color palette.
 *
 * @param {number} i - Index into color array.
 * @returns {string} Color hex code.
 */
function getColor(i) {
  if (i >= COLORS.length) {
    return "#333";
  } else {
    return COLORS[i];
  }
}

/**
 * Add references to application metagroups.
 *
 * Add references to application metagroups by looking for those with subgroups
 * (subapplications) and adding an "- All" option which can be used to filter
 * for all subapplications within the application.
 *
 * @param {Array} applicationNamesRaw - Iterable of string application names.
 */
function getWithMetaApplications(applicationNamesRaw) {
  const applicationNames = Array.of(...applicationNamesRaw);
  const withSubapplications = applicationNames.filter((x) => x.includes(" - "));
  const repeatedApplications = withSubapplications.map((x) => x.split(" - ")[0]);
  const applications = Array.of(...new Set(repeatedApplications));
  const allOptions = applications.map((x) => x + " - All");
  const newAllOptions = allOptions.filter((x) => applicationNames.indexOf(x) == -1);
  return newAllOptions.concat(applicationNames);
}

/**
 * Main presenter class for displaying simulation results.
 */
class ResultsPresenter {
  /**
   * Create a new ResultsPresenter.
   *
   * @param {HTMLElement} root - Root DOM element for results display
   */
  constructor(root) {
    const self = this;
    self._root = root;
    self._results = null;
    self.resetFilter();

    const scorecardContainer = self._root.querySelector("#scorecards");
    const dimensionsContainer = self._root.querySelector("#dimensions");
    const centerChartContainer = self._root.querySelector("#center-chart");
    const centerChartHolderContainer = self._root.querySelector("#center-chart-holder");

    const onUpdateFilterSet = (x) => self._onUpdateFilterSet(x);
    self._scorecardPresenter = new ScorecardPresenter(scorecardContainer, onUpdateFilterSet);
    self._dimensionPresenter = new DimensionCardPresenter(dimensionsContainer, onUpdateFilterSet);
    self._centerChartPresenter = new CenterChartPresenter(centerChartContainer);
    self._titlePreseter = new SelectorTitlePresenter(centerChartHolderContainer, onUpdateFilterSet);
    self._exportPresenter = new ExportPresenter(self._root);
    self._optionsPresenter = new OptionsPanelPresenter(self._root, onUpdateFilterSet);

    self.hide();
  }

  /**
   * Reset the filters active in the results section.
   */
  resetFilter() {
    const self = this;
    self._filterSet = new FilterSet(
      null,
      null,
      null,
      null,
      "emissions:recharge:MtCO2e / yr",
      "simulations",
      null,
      false,
      null,
    );
  }

  /**
   * Hide the results display.
   */
  hide() {
    const self = this;
    self._root.style.display = "none";
  }

  /**
   * Show simulation results.
   *
   * @param {ReportDataWrapper} results - Results data to display.
   * @param {BackendResult} backendResult - Backend result containing CSV string.
   */
  showResults(results, backendResult) {
    const self = this;
    self._root.style.display = "block";
    self._results = results;
    self._backendResult = backendResult;
    self._updateInternally();
  }

  /**
   * Handle filter set updates.
   *
   * @param {FilterSet} newFilterSet - Updated filter settings.
   * @private
   */
  _onUpdateFilterSet(newFilterSet) {
    const self = this;
    self._filterSet = self._constrainFilterSet(newFilterSet);
    self._updateInternally();
  }

  /**
   * Constrain the filter set to avoid more difficult to interpret charts.
   *
   * Ensure that the filter set does not have both all scenarios and a non-
   * scenario dimension value.
   */
  _constrainFilterSet(filterSet) {
    const self = this;

    let constrainedFilterSet = filterSet;

    // Validate that selected values exist in results and reset to null if not found
    if (self._results !== null) {
      // Check if selected scenario exists
      const selectedScenario = constrainedFilterSet.getScenario();
      if (selectedScenario !== null) {
        const availableScenarios = self._results.getScenarios(
          constrainedFilterSet.getWithScenario(null));
        if (!availableScenarios.has(selectedScenario)) {
          constrainedFilterSet = constrainedFilterSet.getWithScenario(null);
        }
      }

      // Check if selected application exists
      const selectedApplication = constrainedFilterSet.getApplication();
      if (selectedApplication !== null) {
        const availableApplications = self._results.getApplications(
          constrainedFilterSet.getWithApplication(null));
        if (!availableApplications.has(selectedApplication)) {
          constrainedFilterSet = constrainedFilterSet.getWithApplication(null);
        }
      }

      // Check if selected substance exists
      const selectedSubstance = constrainedFilterSet.getSubstance();
      if (selectedSubstance !== null) {
        const availableSubstances = self._results.getSubstances(
          constrainedFilterSet.getWithSubstance(null));
        if (!availableSubstances.has(selectedSubstance)) {
          constrainedFilterSet = constrainedFilterSet.getWithSubstance(null);
        }
      }
    }

    // Validate custom metrics have definitions
    if (constrainedFilterSet.isCustomMetric()) {
      const metricFamily = constrainedFilterSet.getMetric();
      const customDef = constrainedFilterSet.getCustomDefinition(metricFamily);

      if (!customDef || customDef.length === 0) {
        // Switch to a default submetric for the family
        const defaultSubmetrics = {
          "emissions": "recharge",
          "sales": "manufacture",
        };

        const defaultSubmetric = defaultSubmetrics[metricFamily];
        if (defaultSubmetric) {
          const currentUnits = constrainedFilterSet.getUnits();
          const defaultMetric = `${metricFamily}:${defaultSubmetric}:${currentUnits}`;
          constrainedFilterSet = constrainedFilterSet.getWithMetric(defaultMetric);
        }
      }
    }

    // Original constraint logic to avoid difficult to interpret charts
    const isAllSimulations = constrainedFilterSet.getScenario() === null;
    const isSimulationDimension = constrainedFilterSet.getDimension() === "simulations";
    const needsConstraints = isAllSimulations && !isSimulationDimension;

    if (needsConstraints && self._results !== null) {
      const firstScenario = self._results.getFirstScenario(constrainedFilterSet);
      return constrainedFilterSet.getWithScenario(firstScenario);
    } else {
      return constrainedFilterSet;
    }
  }

  /**
   * Update all sub-presenters with current data.
   *
   * @private
   */
  _updateInternally() {
    const self = this;

    const years = self._results.getYears(self._filterSet.getWithYear(null));
    self._filterSet = self._filterSet.getWithYear(Math.max(...years));

    self._scorecardPresenter.showResults(self._results, self._filterSet);
    self._dimensionPresenter.showResults(self._results, self._filterSet);
    self._centerChartPresenter.showResults(self._results, self._filterSet);
    self._titlePreseter.showResults(self._results, self._filterSet);
    self._exportPresenter.showResults(self._results, self._filterSet, self._backendResult);
    self._optionsPresenter.showResults(self._results, self._filterSet);
  }
}

/**
 * Presenter for configuring and executing results exports.
 */
class ExportPresenter {
  /**
   * Create a new ExportPresenter.
   *
   * @param {HTMLElement} root - Root DOM element.
   */
  constructor(root) {
    const self = this;
    self._root = root;
  }

  /**
   * Update export data with new results.
   *
   * @param {Object} results - Results data to export.
   * @param {FilterSet} filterSet - Current filter settings.
   * @param {BackendResult} backendResult - Backend result containing CSV string.
   */
  showResults(results, filterSet, backendResult) {
    const self = this;

    // Use the CSV string directly from the backend instead of generating our own
    const csvStr = backendResult.getCsvString();
    const encodedValue = encodeURI("data:text/csv;charset=utf-8," + csvStr);
    const exportLink = document.getElementById("export-button");
    exportLink.href = encodedValue;
  }
}

/**
 * Presenter for scorecard metrics display.
 *
 * Presenter for scorecard metrics display that, in addition to optionally
 * showing a high level metric, also allows for changing filter values.
 */
class ScorecardPresenter {
  /**
   * Create a new ScorecardPresenter.
   *
   * @param {HTMLElement} root - Root DOM element.
   * @param {Function} onUpdateFilterSet - Callback for filter updates.
   */
  constructor(root, onUpdateFilterSet) {
    const self = this;
    self._root = root;
    self._filterSet = null;
    self._onUpdateFilterSet = onUpdateFilterSet;

    // Create custom metric presenters
    self._customPresenters = {};
    self._customPresenters.emissions = new CustomMetricPresenter(
      "custom-emissions-dialog",
      ["recharge", "eol", "export"],
      (selection) => self._onCustomMetricChanged("emissions", selection),
    );
    self._customPresenters.sales = new CustomMetricPresenter(
      "custom-sales-dialog",
      ["manufacture", "import", "export", "recycle"],
      (selection) => self._onCustomMetricChanged("sales", selection),
    );

    self._registerEventListeners();
  }

  /**
   * Update scorecards with new results data.
   *
   * @param {Object} results - Results data to display.
   * @param {FilterSet} filterSet - Current filter settings.
   */
  showResults(results, filterSet) {
    const self = this;
    self._filterSet = filterSet;

    /**
     * Execute updates in the UI to show the results without checks for invalid user selections.
     */
    const showUnsafe = () => {
      const currentYear = self._filterSet.getYear();

      const emissionsScorecard = self._root.querySelector("#emissions-scorecard");
      const salesScorecard = self._root.querySelector("#sales-scorecard");
      const equipmentScorecard = self._root.querySelector("#equipment-scorecard");

      const emissionsValue = results.getTotalEmissions(filterSet);
      const salesValue = results.getSales(filterSet);
      const equipmentValue = results.getPopulation(filterSet);

      const roundToTenths = (x) => Math.round(x * 10) / 10;
      const emissionRounded = roundToTenths(emissionsValue.getValue() / 1000000);
      const salesMt = roundToTenths(salesValue.getValue() / 1000000) + " k";
      const millionEqipment = roundToTenths(equipmentValue.getValue() / 1000000) + " M";

      const metricSelected = filterSet.getMetric();
      const emissionsSelected = metricSelected === "emissions";
      const salesSelected = metricSelected === "sales";
      const equipmentSelected = metricSelected === "population";

      const scenarios = results.getScenarios(self._filterSet.getWithScenario(null));
      const showVal = ALLOW_SCORE_DISPLAY && self._filterSet.hasSingleScenario(scenarios);
      const hideVal = !showVal;

      self._updateCard(emissionsScorecard, emissionRounded, currentYear,
        emissionsSelected, hideVal);
      self._updateCard(salesScorecard, salesMt, currentYear, salesSelected, hideVal);
      self._updateCard(equipmentScorecard, millionEqipment, currentYear,
        equipmentSelected, hideVal);
    };

    // Execute with a catch for invalid user selections.
    try {
      showUnsafe();
    } catch (error) {
      // Reset filter set to default when null values cause errors
      console.warn("Error in ScorecardPresenter.showResults, resetting filter set:", error);
      self._onUpdateFilterSet(new FilterSet(
        null,
        null,
        null,
        null,
        "emissions:recharge:MtCO2e / yr",
        "simulations",
        null,
        false,
        null,
      ));
    }
  }

  /**
   * Handle custom metric definition changes.
   *
   * @param {string} metricFamily - The metric family ('emissions' or 'sales').
   * @param {Array<string>} selection - Array of selected submetrics.
   * @private
   */
  _onCustomMetricChanged(metricFamily, selection) {
    const self = this;

    // Update custom definition in filter set
    const newFilterSet = self._filterSet.getWithCustomDefinition(metricFamily, selection);

    // Switch to custom metric if not already
    const currentMetric = newFilterSet.getMetric();
    const currentUnits = newFilterSet.getUnits();

    if (currentMetric === metricFamily) {
      const customMetric = `${metricFamily}:custom:${currentUnits}`;
      const finalFilterSet = newFilterSet.getWithMetric(customMetric);
      self._onUpdateFilterSet(finalFilterSet);
    } else {
      self._onUpdateFilterSet(newFilterSet);
    }
  }

  /**
   * Update an individual scorecard.
   *
   * @param {HTMLElement} scorecard - Scorecard DOM element.
   * @param {string|number} value - Value to display.
   * @param {number} currentYear - Current year.
   * @param {boolean} selected - Flag indicating if the card is selected.
   * @param {boolean} hideVal - Flag indicating if the value display should be
   *     hidden. True if a value should be displayed and false otherwise which
   *     may be appropriate if a single summary value cannot be generated.
   * @private
   */
  _updateCard(scorecard, value, currentYear, selected, hideVal) {
    const self = this;
    self._setText(scorecard.querySelector(".value"), value);

    if (hideVal) {
      scorecard.querySelector(".value").style.display = "none";
    } else {
      scorecard.querySelector(".value").style.display = "block";
    }

    if (selected) {
      scorecard.classList.remove("inactive");
    } else {
      scorecard.classList.add("inactive");
    }

    d3.select(scorecard).select(".metric-radio").property("checked", selected);
  }

  /**
   * Set text content of an element.
   *
   * @param {HTMLElement} selection - Element to update.
   * @param {string} value - New text value.
   * @private
   */
  _setText(selection, value) {
    const self = this;
    selection.innerHTML = "";
    const newTextNode = document.createTextNode(value);
    selection.appendChild(newTextNode);
  }

  /**
   * Register event listeners for scorecard interactions.
   *
   * @private
   */
  _registerEventListeners() {
    const self = this;

    const emissionsScorecard = self._root.querySelector("#emissions-scorecard");
    const salesScorecard = self._root.querySelector("#sales-scorecard");
    const equipmentScorecard = self._root.querySelector("#equipment-scorecard");

    const registerListener = (scorecard, family) => {
      const subMetricDropdown = scorecard.querySelector(".submetric-input");
      const unitsDropdown = scorecard.querySelector(".units-input");
      const customConfigLink = scorecard.querySelector(".configure-custom-link");

      const callback = () => {
        const subMetric = subMetricDropdown.value;
        const units = unitsDropdown.value;

        // Handle custom metric selection
        if (subMetric === "custom") {
          const customPresenter = self._customPresenters[family];
          const currentDef = customPresenter.getCurrentDefinition();

          // Set the current definition based on FilterSet
          const filterSetDef = self._filterSet.getCustomDefinition(family);
          if (filterSetDef) {
            customPresenter.setCurrentDefinition(filterSetDef);
          }

          if (!currentDef || currentDef.length === 0) {
            customPresenter.showDialog();
            return; // Don't update filter until dialog is completed
          }
        }

        const fullName = family + ":" + subMetric + ":" + units;
        const newFilterSet = self._filterSet.getWithMetric(fullName);
        self._onUpdateFilterSet(newFilterSet);
      };

      const radio = scorecard.querySelector(".metric-radio");
      radio.addEventListener("click", callback);

      subMetricDropdown.addEventListener("change", callback);
      unitsDropdown.addEventListener("change", callback);

      // Custom configuration link listener
      if (customConfigLink) {
        customConfigLink.addEventListener("click", (event) => {
          event.preventDefault();
          const customPresenter = self._customPresenters[family];

          // Set current definition before showing dialog
          const filterSetDef = self._filterSet.getCustomDefinition(family);
          if (filterSetDef) {
            customPresenter.setCurrentDefinition(filterSetDef);
          }

          customPresenter.showDialog();
        });
      }
    };

    registerListener(emissionsScorecard, "emissions");
    registerListener(salesScorecard, "sales");
    registerListener(equipmentScorecard, "population");
  }
}

/**
 * Presenter for dimension cards display.
 *
 * Presenter which shows the dimensions selectors with embedded bar charts that
 * allow for changing of filters.
 */
class DimensionCardPresenter {
  /**
   * Create a new DimensionCardPresenter.
   *
   * @param {HTMLElement} root - Root DOM element.
   * @param {Function} onUpdateFilterSet - Callback for filter updates.
   */
  constructor(root, onUpdateFilterSet) {
    const self = this;
    self._root = root;
    self._onUpdateFilterSet = onUpdateFilterSet;
    self._filterSet = null;
    self._registerEventListeners();
  }

  /**
   * Update dimension cards with new results
   * @param {Object} results - Results data to display
   * @param {FilterSet} filterSet - Current filter settings
   */
  showResults(results, filterSet) {
    const self = this;
    self._filterSet = filterSet;

    const metricSelected = self._filterSet.getMetric();
    const metricUnits = self._filterSet.getUnits();

    const currentYear = self._filterSet.getYear();
    const scenarios = results.getScenarios(self._filterSet.getWithScenario(null));

    const allTickUnits = Array.of(...self._root.querySelectorAll(".units-tick"));
    allTickUnits.forEach((x) => (x.innerHTML = metricUnits));

    const allTickYears = Array.of(...self._root.querySelectorAll(".years-tick"));
    if (self._filterSet.hasSingleScenario(scenarios)) {
      allTickYears.forEach((x) => (x.innerHTML = "in year " + currentYear));
    } else {
      allTickYears.forEach((x) => (x.innerHTML = ""));
    }

    const simulationsCard = self._root.querySelector("#simulations-dimension");
    const applicationsCard = self._root.querySelector("#applications-dimension");
    const substancesCard = self._root.querySelector("#substances-dimension");

    const dimensionSelected = self._filterSet.getDimension();
    const simulationsSelected = dimensionSelected === "simulations";
    const applicationsSelected = dimensionSelected === "applications";
    const substancesSelected = dimensionSelected === "substances";

    const interpret = (x) => (x === null ? null : x.getValue());

    self._updateCard(
      "sim",
      simulationsCard,
      results.getScenarios(self._filterSet.getWithScenario(null)),
      simulationsSelected,
      self._filterSet.getScenario(),
      (x) => self._filterSet.getWithScenario(x),
      true,
      (value) => interpret(results.getMetric(self._filterSet.getWithScenario(value))),
      metricUnits,
      scenarios,
    );

    self._updateCard(
      "app",
      applicationsCard,
      getWithMetaApplications(results.getApplications(self._filterSet.getWithApplication(null))),
      applicationsSelected,
      self._filterSet.getApplication(),
      (x) => self._filterSet.getWithApplication(x),
      true,
      (value) => interpret(results.getMetric(self._filterSet.getWithApplication(value))),
      metricUnits,
      scenarios,
    );

    self._updateCard(
      "sub",
      substancesCard,
      results.getSubstances(self._filterSet.getWithSubstance(null)),
      substancesSelected,
      self._filterSet.getSubstance(),
      (x) => self._filterSet.getWithSubstance(x),
      true,
      (value) => interpret(results.getMetric(self._filterSet.getWithSubstance(value))),
      metricUnits,
      scenarios,
    );
  }

  /**
   * Update an individual dimension card.
   *
   * @param {string} label - Card identifier.
   * @param {HTMLElement} card - Card DOM element.
   * @param {Set<string>} identifiers - Set of dimension values.
   * @param {boolean} selected - Whether card is selected.
   * @param {string} subSelection - Currently selected value.
   * @param {Function} subFilterSetBuilder - Filter builder function.
   * @param {boolean} addAll - Whether to add "All" option. True if should be
   *     added and false otherwise.
   * @param {Function} valueGetter - Function to get display value.
   * @param {string} suffix - Value suffix like for units.
   * @param {Set<string>} scenarios - Available scenarios.
   * @private
   */
  _updateCard(
    label,
    card,
    identifiers,
    selected,
    subSelection,
    subFilterSetBuilder,
    addAll,
    valueGetter,
    suffix,
    scenarios,
  ) {
    const self = this;

    if (selected) {
      card.classList.remove("inactive");
    } else {
      card.classList.add("inactive");
    }

    d3.select(card).select(".dimension-radio").property("checked", selected);

    const identifiersArray = Array.of(...identifiers);
    identifiersArray.sort();

    const values = identifiersArray.map(valueGetter);
    const maxValue = Math.max(...values);
    d3.select(card.querySelector(".right-tick")).text(Math.round(maxValue));

    const hasSingleScenario = self._filterSet.hasSingleScenario(scenarios);
    const isOnlyValue = identifiersArray.length == 1;

    const allNeeded = ALLOW_REDUNDANT_ALL ? addAll : addAll && !isOnlyValue;
    if (allNeeded) {
      identifiersArray.unshift("All");
    }

    const listSelection = d3.select(card).select(".list");
    listSelection.html("");

    const itemDivs = listSelection
      .selectAll(".item")
      .data(identifiersArray)
      .enter()
      .append("div")
      .classed("item", true);

    const itemLabels = itemDivs.append("label");

    itemLabels
      .append("input")
      .attr("type", "radio")
      .classed(label + "-radio", true)
      .attr("name", label + "-viz")
      .style("height", "13px")
      .style("width", "13px")
      .property("checked", (x) => {
        const valuesMatch = x === subSelection;
        const isAllAndSelected = subSelection === null && x === "All";
        return valuesMatch || isAllAndSelected || isOnlyValue;
      });

    itemLabels.append("span").text((x) => x);

    itemLabels.on("click", (event, x) => {
      const newFilterSet = subFilterSetBuilder(x === "All" ? null : x);
      self._onUpdateFilterSet(newFilterSet);
    });

    if (hasSingleScenario || label === "sim") {
      const offset = allNeeded ? 1 : 0;
      const lineHolders = itemDivs.append("div").classed("list-line-holder", true);

      const lines = lineHolders
        .append("div")
        .classed("list-line", true)
        .style("width", "100%")
        .style("height", (x, i) => (x === "All" ? "0px" : "1px"))
        .style("background-color", (x, i) => (selected ? getColor(i - offset) : "#C0C0C0"));

      lines
        .append("div")
        .classed("list-bar", true)
        .style("height", (x, i) => (x === "All" ? "0px" : "5px"))
        .style("background-color", (x, i) => (selected ? getColor(i - offset) : "#C0C0C0"))
        .style("width", (x) => {
          if (x === "All") {
            return "0%";
          } else {
            const value = valueGetter(x);
            const percent = value / maxValue;
            return Math.round(percent * 100) + "%";
          }
        });

      d3.select(card).select(".axis").style("display", "grid");
    } else {
      d3.select(card).select(".axis").style("display", "none");
    }
  }

  /**
   * Register event listeners for dimension card interactions.
   *
   * @private
   */
  _registerEventListeners() {
    const self = this;

    const simulationsCard = self._root.querySelector("#simulations-dimension");
    const applicationsCard = self._root.querySelector("#applications-dimension");
    const substancesCard = self._root.querySelector("#substances-dimension");

    const registerListener = (scorecard, value) => {
      const radio = scorecard.querySelector(".dimension-radio");
      radio.addEventListener("click", () => {
        const newFilterSet = self._filterSet.getWithDimension(value);
        self._onUpdateFilterSet(newFilterSet);
      });
    };

    registerListener(simulationsCard, "simulations");
    registerListener(applicationsCard, "applications");
    registerListener(substancesCard, "substances");
  }
}

/**
 * Presenter for options checkboxes.
 *
 * Presenter for options checkboxes at the bottom of the results panel before export button which,
 * at this time, only includes a checkbox for attributing initial charge to importer (defaults to
 * unchecked / attribute to exporter).
 */
class OptionsPanelPresenter {
  /**
   * Create a new OptionsPanelPresenter.
   *
   * @param {HTMLElement} root - Root DOM element.
   * @param {Function} onUpdateFilterSet - Callback for filter updates.
   */
  constructor(root, onUpdateFilterSet) {
    const self = this;
    self._root = root;
    self._onUpdateFilterSet = onUpdateFilterSet;
    self._filterSet = null;
    self._attributeImporterCheck = self._root.querySelector("#importer-assignment-check");
    self._registerEventListeners();
  }

  /**
   * Update dimension cards with new results
   * @param {Object} results - Results data to display
   * @param {FilterSet} filterSet - Current filter settings
   */
  showResults(results, filterSet) {
    const self = this;
    self._filterSet = filterSet;
    self._attributeImporterCheck.checked = self._filterSet.getAttributeImporter();
  }


  /**
   * Register event listeners for options being changed.
   */
  _registerEventListeners() {
    const self = this;
    self._attributeImporterCheck.addEventListener("change", () => {
      const newValue = self._attributeImporterCheck.checked;

      const newFilterSet = self._filterSet.getWithAttributeImporter(newValue);
      self._onUpdateFilterSet(newFilterSet);
    });
  }
}

/**
 * Presenter for the central chart visualization.
 *
 * Presenter for the central chart visualization which is currently backed by
 * Chartjs.
 */
class CenterChartPresenter {
  /**
   * Create a new CenterChartPresenter.
   *
   * @param {HTMLElement} root - Root DOM element
   */
  constructor(root) {
    const self = this;
    self._root = root;
    self._chart = null;
  }

  /**
   * Update chart with new results.
   *
   * @param {Object} results - Results data to display.
   * @param {FilterSet} filterSet - Current filter settings.
   */
  showResults(results, filterSet) {
    const self = this;

    if (self._chart !== null) {
      self._chart.destroy();
    }

    const years = Array.of(...results.getYears(filterSet.getWithYear(null)));
    years.sort((a, b) => a - b);

    const getDimensionValues = (filterSet) => {
      const dimensionValuesRaw = Array.of(...results.getDimensionValues(filterSet));

      if (filterSet.getDimension() === "applications") {
        return getWithMetaApplications(dimensionValuesRaw);
      } else {
        return dimensionValuesRaw;
      }
    };
    const dimensionValues = getDimensionValues(filterSet);
    dimensionValues.sort();

    const getForDimValue = (dimValue) => {
      const valsWithUnits = years.map((year) => {
        const withYear = filterSet.getWithYear(year);
        const subFilterSet = withYear.getWithDimensionValue(dimValue);

        if (filterSet.getBaseline() === null) {
          return results.getMetric(subFilterSet);
        } else {
          const absoluteVal = results.getMetric(subFilterSet);
          const baselineFilterSet = subFilterSet.getWithScenario(filterSet.getBaseline());
          const baselineVal = results.getMetric(baselineFilterSet);

          if (absoluteVal === null || baselineVal === null) {
            return null;
          }

          if (absoluteVal.getUnits() !== baselineVal.getUnits()) {
            throw "Mismanaged units in absolute vs baseline.";
          }

          return new EngineNumber(
            absoluteVal.getValue() - baselineVal.getValue(),
            absoluteVal.getUnits(),
          );
        }
      });
      const valsWithUnitsValid = valsWithUnits.filter((x) => x !== null);
      const vals = valsWithUnitsValid.map((x) => x.getValue());
      return {name: dimValue, vals: vals};
    };
    const dimensionSeries = dimensionValues.map(getForDimValue);

    const unconstrainedDimValues = getDimensionValues(filterSet.getWithDimensionValue(null));
    unconstrainedDimValues.sort();

    const chartJsDatasets = dimensionSeries.map((x) => {
      const index = unconstrainedDimValues.indexOf(x["name"]);
      const color = getColor(index);
      return {
        label: x["name"],
        data: x["vals"],
        fill: false,
        borderColor: color,
        backgroundColor: color,
      };
    });

    const minVals = dimensionSeries.map((x) => {
      return Math.min(...x["vals"]);
    });
    const minVal = Math.min(...minVals);

    const chartJsData = {
      labels: years,
      datasets: chartJsDatasets,
    };

    const metricSelected = filterSet.getMetric();
    const metricUnits = filterSet.getUnits();

    const chartJsConfig = {
      type: "line",
      data: chartJsData,
      options: {
        scales: {
          y: {
            min: minVal >= 0 ? 0 : null,
            title: {text: metricUnits, display: true},
          },
          x: {
            title: {text: "Year", display: true},
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: (x) => "Year " + x[0]["label"],
            },
          },
          legend: {
            display: false,
          },
        },
      },
    };

    self._chart = new Chart(self._root, chartJsConfig);
  }
}

/**
 * Presenter for selector title display.
 *
 * Presenter for selector title display using a fill in the blank-like
 * approach.
 */
class SelectorTitlePresenter {
  /**
   * Create a new SelectorTitlePresenter.
   *
   * @param {HTMLElement} root - Root DOM element.
   * @param {Function} changeCallback - Callback for selection changes.
   */
  constructor(root, changeCallback) {
    const self = this;
    self._selection = root;
    self._changeCallback = changeCallback;
    self._filterSet = null;
    self._setupEventListeners();
  }

  /**
   * Update selector title with new results.
   *
   * @param {Object} results - Results data to display.
   * @param {FilterSet} filterSet - Current filter settings.
   */
  showResults(results, filterSet) {
    const self = this;
    self._filterSet = filterSet;

    const metricDropdown = self._selection.querySelector(".metric-select");
    const metricSelected = self._filterSet.getMetric();
    self._updateSimpleDropdown(metricDropdown, metricSelected);

    const dimensionDropdown = self._selection.querySelector(".dimension-select");
    const dimensionSelected = self._filterSet.getDimension();
    self._updateSimpleDropdown(dimensionDropdown, dimensionSelected);

    const scenarioDropdown = self._selection.querySelector(".scenario-select");
    const scenarioSelected = self._filterSet.getScenario();
    const scenarios = results.getScenarios(self._filterSet);
    self._updateDynamicDropdown(scenarioDropdown, scenarios, scenarioSelected, "All Simulations");

    const baselineDropdown = self._selection.querySelector(".baseline-select");
    const baselineSelected = self._filterSet.getBaseline();
    self._updateDynamicDropdown(
      baselineDropdown,
      scenarios,
      baselineSelected,
      "Absolute Value",
      "Relative to ",
    );

    const applicationDropdown = self._selection.querySelector(".application-select");
    const applicationSelected = self._filterSet.getApplication();
    const applications = results.getApplications(self._filterSet.getWithApplication(null));
    self._updateDynamicDropdown(
      applicationDropdown,
      getWithMetaApplications(applications),
      applicationSelected,
      "All Applications",
    );

    const substanceDropdown = self._selection.querySelector(".substance-select");
    const substanceSelected = self._filterSet.getSubstance();
    const substances = results.getSubstances(self._filterSet.getWithSubstance(null));
    self._updateDynamicDropdown(substanceDropdown, substances, substanceSelected, "All Substances");
  }

  /**
   * Update a simple dropdown with fixed options.
   *
   * @param {HTMLElement} selection - Dropdown element.
   * @param {string} value - Selected value.
   * @private
   */
  _updateSimpleDropdown(selection, value) {
    const self = this;
    selection.value = value;
  }

  /**
   * Update a dynamic dropdown with variable options.
   *
   * @param {HTMLElement} selection - Dropdown element.
   * @param {Set<string>} allValues - Available values.
   * @param {string} selectedValue - Currently selected value.
   * @param {string} allText - Text for "All" option.
   * @param {string} prefix - Optional string prefix to prepend to non-all text
   *     defaulting to empty string.
   * @private
   */
  _updateDynamicDropdown(selection, allValues, selectedValue, allText, prefix) {
    const self = this;

    if (prefix === undefined) {
      prefix = "";
    }

    const allValuesArray = Array.of(...allValues);
    allValuesArray.unshift(allText);
    allValuesArray.sort();

    const d3Selection = d3.select(selection);
    d3Selection.html("");
    d3Selection
      .selectAll("option")
      .data(allValuesArray)
      .enter()
      .append("option")
      .attr("value", (x) => (allText === x ? "" : x))
      .text((x) => (x === allText ? x : prefix + x))
      .property("selected", (x) => {
        const nativelySelected = x === selectedValue;
        const allSelected = x === allText && selectedValue === null;
        return nativelySelected || allSelected;
      });
  }

  /**
   * Set up event listeners for selector dropdowns.
   *
   * @private
   */
  _setupEventListeners() {
    const self = this;

    const addListener = (selection, newFilterSetGen) => {
      selection.addEventListener("change", () => {
        const value = selection.value === "" ? null : selection.value;
        const newFilterSet = newFilterSetGen(self._filterSet, value);
        self._changeCallback(newFilterSet);
      });
    };

    const metricDropdown = self._selection.querySelector(".metric-select");
    addListener(metricDropdown, (filterSet, val) => filterSet.getWithMetric(val));

    const dimensionDropdown = self._selection.querySelector(".dimension-select");
    addListener(dimensionDropdown, (filterSet, val) => filterSet.getWithDimension(val));

    const scenarioDropdown = self._selection.querySelector(".scenario-select");
    addListener(scenarioDropdown, (filterSet, val) => filterSet.getWithScenario(val));

    const applicationDropdown = self._selection.querySelector(".application-select");
    addListener(applicationDropdown, (filterSet, val) => filterSet.getWithApplication(val));

    const substanceDropdown = self._selection.querySelector(".substance-select");
    addListener(substanceDropdown, (filterSet, val) => filterSet.getWithSubstance(val));

    const baselineDropdown = self._selection.querySelector(".baseline-select");
    addListener(baselineDropdown, (filterSet, val) => filterSet.getWithBaseline(val));
  }
}

/**
 * Presenter for custom metric configuration and management.
 *
 * Handles the definition and presentation of custom metrics that combine
 * multiple submetrics based on user selection. Manages dialog interactions
 * and maintains the current custom metric definition.
 */
class CustomMetricPresenter {
  /**
   * Create a new CustomMetricPresenter.
   *
   * @param {string} dialogId - ID of the configuration dialog element.
   * @param {Array<string>} availableOptions - Array of available submetric options.
   * @param {Function} onSelectionChanged - Callback when custom definition changes.
   */
  constructor(dialogId, availableOptions, onSelectionChanged) {
    const self = this;
    self._dialog = document.getElementById(dialogId);
    self._availableOptions = availableOptions;
    self._onSelectionChanged = onSelectionChanged;

    if (!self._dialog) {
      throw new Error(`Dialog with id '${dialogId}' not found`);
    }

    self._setupEventListeners();
  }

  /**
   * Get the current custom metric definition.
   *
   * @returns {Array<string>|null} Array of selected submetrics or null if none.
   */
  getCurrentDefinition() {
    const self = this;
    const checkboxes = self._dialog.querySelectorAll('input[type="checkbox"]:checked');
    const selected = Array.from(checkboxes).map((cb) => cb.value);
    return selected.length > 0 ? selected : null;
  }

  /**
   * Set the current custom metric definition.
   *
   * @param {Array<string>|null} definition - Array of submetrics to select.
   */
  setCurrentDefinition(definition) {
    const self = this;
    const checkboxes = self._dialog.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach((checkbox) => {
      checkbox.checked = definition && definition.includes(checkbox.value);
    });

    self._validateSelection();
  }

  /**
   * Show the custom metric configuration dialog.
   */
  showDialog() {
    const self = this;
    self._dialog.showModal();

    // Focus first checkbox
    const firstCheckbox = self._dialog.querySelector('input[type="checkbox"]');
    if (firstCheckbox) {
      firstCheckbox.focus();
    }
  }

  /**
   * Hide the custom metric configuration dialog.
   */
  hideDialog() {
    const self = this;
    self._dialog.close();
  }

  /**
   * Validate current selection and enable/disable Apply button.
   *
   * Ensures at least one checkbox is selected before enabling Apply button.
   * Updates Apply button disabled state and shows/hides validation messages.
   *
   * @private
   */
  _validateSelection() {
    const self = this;
    const selected = self.getCurrentDefinition();
    const applyButton = self._dialog.querySelector(".primary");

    if (selected && selected.length > 0) {
      applyButton.classList.remove("disabled");
      applyButton.style.pointerEvents = "auto";
      applyButton.style.opacity = "1";
    } else {
      applyButton.classList.add("disabled");
      applyButton.style.pointerEvents = "none";
      applyButton.style.opacity = "0.5";
    }
  }

  /**
   * Set up event listeners for dialog interactions.
   *
   * @private
   */
  _setupEventListeners() {
    const self = this;

    // Apply button listener
    const applyButton = self._dialog.querySelector(".primary");
    applyButton.addEventListener("click", (event) => {
      event.preventDefault();
      const selected = self.getCurrentDefinition();
      if (selected && selected.length > 0) {
        self._onSelectionChanged(selected);
        self.hideDialog();
      }
    });

    // Cancel button listener
    const cancelButton = self._dialog.querySelector(".secondary");
    cancelButton.addEventListener("click", (event) => {
      event.preventDefault();
      self.hideDialog();
    });

    // Checkbox change listeners for immediate validation
    const checkboxes = self._dialog.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        self._validateSelection();
      });
    });

    // Initialize validation state
    self._validateSelection();
  }
}

export {ResultsPresenter};
