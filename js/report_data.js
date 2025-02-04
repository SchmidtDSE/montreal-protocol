
/**
 * Data structures for report and visualization functionality.
 *
 * @license BSD, see LICENSE.md.
 */

import {EngineNumber} from "engine_number";

/**
 * Class representing aggregated result data for a specific metric
 */
class AggregatedResult {
  /**
   * Create a new aggregated result
   * @param {EngineNumber} manufactureValue - The manufacturing value
   * @param {EngineNumber} importValue - The import value
   * @param {EngineNumber} consumptionValue - The consumption value
   * @param {EngineNumber} populationValue - The equipment population value
   */
  constructor(manufactureValue, importValue, consumptionValue, populationValue) {
    const self = this;
    self._manufactureValue = manufactureValue;
    self._importValue = importValue;
    self._consumptionValue = consumptionValue;
    self._populationValue = populationValue;
  }

  /**
   * Get the manufacture value
   * @returns {EngineNumber} The manufacture value
   */
  getManufacture() {
    const self = this;
    return self._manufactureValue;
  }

  /**
   * Get the import value
   * @returns {EngineNumber} The import value
   */
  getImport() {
    const self = this;
    return self._importValue;
  }

  /**
   * Get combined sales value (manufacture + import)
   * @returns {EngineNumber} The combined sales value
   */
  getSales() {
    const self = this;
    const manufactureValue = self.getManufacture();
    const importValue = self.getImport();
    const sales = self._combineUnitValue(manufactureValue, importValue);
    return sales;
  }

  /**
   * Get the consumption value
   * @returns {EngineNumber} The consumption value
   */
  getConsumption() {
    const self = this;
    return self._consumptionValue;
  }

  /**
   * Get the population value
   * @returns {EngineNumber} The population value
   */
  getPopulation() {
    const self = this;
    return self._populationValue;
  }

  /**
   * Combine this result with another result
   * @param {AggregatedResult} other - The other result to combine with
   * @returns {AggregatedResult} A new combined result
   */
  combine(other) {
    const self = this;

    const manufactureValue = self._combineUnitValue(self.getManufacture(), other.getManufacture());
    const importValue = self._combineUnitValue(self.getImport(), other.getImport());
    const consumptionValue = self._combineUnitValue(self.getConsumption(), other.getConsumption());
    const populationValue = self._combineUnitValue(self.getPopulation(), other.getPopulation());

    return new AggregatedResult(manufactureValue, importValue, consumptionValue, populationValue);
  }

  /**
   * Combine two unit values with the same units
   * @private
   * @param {EngineNumber} a - First value
   * @param {EngineNumber} b - Second value
   * @returns {EngineNumber} Combined value
   * @throws {string} If units don't match
   */
  _combineUnitValue(a, b) {
    const self = this;
    if (a.getUnits() !== b.getUnits()) {
      throw "Encountered different units during aggregation.";
    }
    return new EngineNumber(a.getValue() + b.getValue(), a.getUnits());
  }
}

/**
 * Wrapper class for report data that provides filtering and aggregation capabilities
 */
class ReportDataWrapper {
  /**
   * Create a new report data wrapper
   * @param {Object} innerData - The raw report data to wrap
   */
  constructor(innerData) {
    const self = this;
    self._innerData = innerData;
  }

  /**
   * Get the raw underlying data
   * @returns {Object} The raw data
   */
  getRawData() {
    const self = this;
    return self._innerData;
  }

  /**
   * Get metric value based on filter set
   * @param {FilterSet} filterSet - The filter criteria to apply
   * @returns {EngineNumber} The filtered metric value
   */
  getMetric(filterSet) {
    const self = this;
    const metric = filterSet.getMetric();
    const strategy = {
      consumption: () => self.getConsumption(filterSet),
      sales: () => self.getSales(filterSet),
      population: () => self.getPopulation(filterSet),
    }[metric];
    const value = strategy();
    return value;
  }

  /**
   * Get dimension values based on filter set
   * @param {FilterSet} filterSet - The filter criteria to apply
   * @returns {Set<*>} Set of dimension values
   */
  getDimensionValues(filterSet) {
    const self = this;
    const dimension = filterSet.getDimension();
    const strategy = {
      simulations: () => self.getScenarios(filterSet),
      applications: () => self.getApplications(filterSet),
      substances: () => self.getSubstances(filterSet),
    }[dimension];
    const value = strategy();
    return value;
  }

  /**
   * Get scenarios matching filter set
   * @param {FilterSet} filterSet - The filter criteria to apply
   * @returns {Set<string>} Set of scenario names
   */
  getScenarios(filterSet) {
    const self = this;
    if (filterSet === undefined || filterSet.getScenario() === null) {
      return new Set(self._innerData.map((x) => x.getName()));
    } else {
      return new Set([filterSet.getScenario()]);
    }
  }

  /**
   * Get applications matching filter set
   * @param {FilterSet} filterSet - The filter criteria to apply
   * @returns {Set<string>} Set of application names
   */
  getApplications(filterSet) {
    const self = this;
    return self._getSetAfterFilter(filterSet, (x) => x.getApplication());
  }

  /**
   * Get substances matching filter set
   * @param {FilterSet} filterSet - The filter criteria to apply
   * @returns {Set<string>} Set of substance names
   */
  getSubstances(filterSet) {
    const self = this;
    return self._getSetAfterFilter(filterSet, (x) => x.getSubstance());
  }

  /**
   * Get years matching filter set
   * @param {FilterSet} filterSet - The filter criteria to apply
   * @returns {Set<number>} Set of years
   */
  getYears(filterSet) {
    const self = this;
    return self._getSetAfterFilter(filterSet, (x) => x.getYear());
  }

  /**
   * Get consumption value matching filter set
   * @param {FilterSet} filterSet - The filter criteria to apply
   * @returns {EngineNumber} The consumption value
   */
  getConsumption(filterSet) {
    const self = this;
    const aggregated = self._getAggregatedAfterFilter(filterSet);
    return aggregated.getConsumption();
  }

  /**
   * Get sales value matching filter set
   * @param {FilterSet} filterSet - The filter criteria to apply
   * @returns {EngineNumber} The sales value
   */
  getSales(filterSet) {
    const self = this;
    const aggregated = self._getAggregatedAfterFilter(filterSet);
    return aggregated.getSales();
  }

  /**
   * Get population value matching filter set
   * @param {FilterSet} filterSet - The filter criteria to apply
   * @returns {EngineNumber} The population value
   */
  getPopulation(filterSet) {
    const self = this;
    const aggregated = self._getAggregatedAfterFilter(filterSet);
    return aggregated.getPopulation();
  }

  /**
   * Get flattened array of all results
   * @private
   * @returns {Array<*>} Flattened results array
   */
  _getFlatResults() {
    const self = this;
    return self._innerData.map((x) => x.getTrialResults()).flat();
  }

  /**
   * Get filtered set of values using a getter function
   * @private
   * @param {FilterSet} filterSet - The filter criteria
   * @param {Function} getter - Function to get values from filtered results
   * @returns {Set<*>} Set of filtered values
   */
  _getSetAfterFilter(filterSet, getter) {
    const self = this;
    const afterFilter = self._applyFilterSet(filterSet);
    const values = afterFilter.map(getter);
    return new Set(values);
  }

  /**
   * Get aggregated result after applying filters
   * @private
   * @param {FilterSet} filterSet - The filter criteria
   * @returns {AggregatedResult|null} Aggregated result or null if no matches
   */
  _getAggregatedAfterFilter(filterSet) {
    const self = this;
    const afterFilter = self._applyFilterSet(filterSet);
    const preAggregated = afterFilter.map(
      (x) =>
        new AggregatedResult(
          x.getManufacture(),
          x.getImport(),
          x.getConsumption(),
          x.getPopulation(),
        ),
    );

    if (preAggregated.length == 0) {
      return null;
    }

    const aggregated = preAggregated.reduce((a, b) => a.combine(b));

    return aggregated;
  }

  /**
   * Apply filter set to get matching results
   * @private
   * @param {FilterSet} filterSet - The filter criteria
   * @returns {Array<*>} Array of matching results
   */
  _applyFilterSet(filterSet) {
    const self = this;

    const step = (target, filterVal, getter) => {
      if (filterVal === null) {
        return target;
      }

      return target.filter((record) => {
        const candidateVal = getter(record);
        return candidateVal === filterVal;
      });
    };

    const allRecords = self._innerData;

    const scenario = filterSet.getScenario();
    const scenarios = step(allRecords, scenario, (x) => x.getName());

    const trials = scenarios.map((x) => x.getTrialResults());
    const trialsFlat = trials.flat(3);

    const year = filterSet.getYear();
    const withYear = step(trialsFlat, year, (x) => x.getYear());

    const app = filterSet.getApplication();
    const withApp = step(withYear, app, (x) => x.getApplication());

    const sub = filterSet.getSubstance();
    const withSub = step(withApp, sub, (x) => x.getSubstance());

    return withSub;
  }
}

/**
 * Class representing a set of filters for report data
 */
class FilterSet {
  /**
   * Create a new filter set
   * @param {number|null} year - Year filter
   * @param {string|null} scenario - Scenario name filter
   * @param {string|null} application - Application name filter
   * @param {string|null} substance - Substance name filter
   * @param {string|null} metric - Metric type filter
   * @param {string|null} dimension - Dimension type filter
   */
  constructor(year, scenario, application, substance, metric, dimension) {
    const self = this;
    self._year = year;
    self._scenario = scenario;
    self._application = application;
    self._substance = substance;
    self._metric = metric;
    self._dimension = dimension;
  }

  /**
   * Get a new filter set with updated dimension value
   * @param {*} value - The new dimension value
   * @returns {FilterSet} New filter set with updated dimension
   */
  getWithDimensionValue(value) {
    const self = this;
    const strategy = {
      simulations: (x) => self.getWithScenario(x),
      applications: (x) => self.getWithApplication(x),
      substances: (x) => self.getWithSubstance(x),
    }[self.getDimension()];
    return strategy(value);
  }

  /**
   * Get the year filter
   * @returns {number|null} The year filter
   */
  getYear() {
    const self = this;
    return self._year;
  }

  /**
   * Get a new filter set with updated year
   * @param {number} newYear - The new year value
   * @returns {FilterSet} New filter set with updated year
   */
  getWithYear(newYear) {
    const self = this;
    return new FilterSet(
      newYear,
      self._scenario,
      self._application,
      self._substance,
      self._metric,
      self._dimension,
    );
  }

  /**
   * Get the scenario filter
   * @returns {string|null} The scenario filter
   */
  getScenario() {
    const self = this;
    return self._scenario;
  }

  /**
   * Get a new filter set with updated scenario
   * @param {string} newScenario - The new scenario value
   * @returns {FilterSet} New filter set with updated scenario
   */
  getWithScenario(newScenario) {
    const self = this;
    return new FilterSet(
      self._year,
      newScenario,
      self._application,
      self._substance,
      self._metric,
      self._dimension,
    );
  }

  /**
   * Get the application filter
   * @returns {string|null} The application filter
   */
  getApplication() {
    const self = this;
    return self._application;
  }

  /**
   * Get a new filter set with updated application
   * @param {string} newApplication - The new application value
   * @returns {FilterSet} New filter set with updated application
   */
  getWithApplication(newApplication) {
    const self = this;
    return new FilterSet(
      self._year,
      self._scenario,
      newApplication,
      self._substance,
      self._metric,
      self._dimension,
    );
  }

  /**
   * Get the substance filter
   * @returns {string|null} The substance filter
   */
  getSubstance() {
    const self = this;
    return self._substance;
  }

  /**
   * Get a new filter set with updated substance
   * @param {string} newSubstance - The new substance value
   * @returns {FilterSet} New filter set with updated substance
   */
  getWithSubstance(newSubstance) {
    const self = this;
    return new FilterSet(
      self._year,
      self._scenario,
      self._application,
      newSubstance,
      self._metric,
      self._dimension,
    );
  }

  /**
   * Get the metric filter
   * @returns {string|null} The metric filter
   */
  getMetric() {
    const self = this;
    return self._metric;
  }

  /**
   * Get a new filter set with updated metric
   * @param {string} newMetric - The new metric value
   * @returns {FilterSet} New filter set with updated metric
   */
  getWithMetric(newMetric) {
    const self = this;
    return new FilterSet(
      self._year,
      self._scenario,
      self._application,
      self._substance,
      newMetric,
      self._dimension,
    );
  }

  /**
   * Get the dimension filter
   * @returns {string|null} The dimension filter
   */
  getDimension() {
    const self = this;
    return self._dimension;
  }

  /**
   * Get a new filter set with updated dimension
   * @param {string} newDimension - The new dimension value
   * @returns {FilterSet} New filter set with updated dimension
   */
  getWithDimension(newDimension) {
    const self = this;
    return new FilterSet(
      self._year,
      self._scenario,
      self._application,
      self._substance,
      self._metric,
      newDimension,
    );
  }

  /**
   * Check if there is a single scenario selected or available
   * @param {Set<string>} scenarios - Set of available scenarios
   * @returns {boolean} True if single scenario
   */
  hasSingleScenario(scenarios) {
    const self = this;
    const scenarioSelected = self._scenario !== null;
    const onlyOneScenario = scenarios.size == 1;
    return scenarioSelected || onlyOneScenario;
  }
}

export {ReportDataWrapper, FilterSet};
