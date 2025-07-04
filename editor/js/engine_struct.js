/**
 * Structures for describing simulation outputs.
 *
 * @license BSD-3-Clause
 */

import {EngineNumber} from "engine_number";

/**
 * Result of an engine execution for a substance for an application and year.
 *
 * Part of a simulation result representing the values evaluated for a single
 * substance and application within a single year.
 */
class EngineResult {
  /**
   * Constructor for creating an EngineResult instance.
   *
   * @param {string} application - The application associated with this engine
   *     result.
   * @param {string} substance - The substance associated with this engine
   *     result.
   * @param {number} year - The year for which the engine result is relevant.
   * @param {string} scenarioName - The name of the scenario being run.
   * @param {number} trialNumber - The trial number of the current run.
   * @param {EngineNumber} manufactureValue - The value associated with
   *     manufacturing in volume like kg.
   * @param {EngineNumber} importValue - The value related to imports like in
   *     volume like kg.
   * @param {EngineNumber} exportValue - The value related to exports like in
   *     volume like kg.
   * @param {EngineNumber} recycleValue - The value denoting recycled
   *     materials in volume like kg.
   * @param {EngineNumber} domesticConsumptionValue - The domestic consumption
   *     value in tCO2e or equivalent.
   * @param {EngineNumber} importConsumptionValue - The import consumption
   *     value in tCO2e or equivalent.
   * @param {EngineNumber} exportConsumptionValue - The export consumption
   *     value in tCO2e or equivalent.
   * @param {EngineNumber} recycleConsumptionValue - The recycle consumption
   *     value in tCO2e or equivalent.
   * @param {EngineNumber} populationValue - The population value in terms of
   *     equipment.
   * @param {EngineNumber} populationNew - The amount of new equipment added
   *     this year.
   * @param {EngineNumber} rechargeEmissions - The greenhouse gas emissions
   *     from recharge activities.
   * @param {EngineNumber} eolEmissions - The greenhouse gas emissions from
   *     end-of-life equipment.
   * @param {TradeSupplement} tradeSupplement - The supplemental trade data
   *     needed for attribution.
   */
  constructor(
    application,
    substance,
    year,
    scenarioName,
    trialNumber,
    manufactureValue,
    importValue,
    exportValue,
    recycleValue,
    domesticConsumptionValue,
    importConsumptionValue,
    exportConsumptionValue,
    recycleConsumptionValue,
    populationValue,
    populationNew,
    rechargeEmissions,
    eolEmissions,
    energyConsumption,
    tradeSupplement,
  ) {
    const self = this;
    self._application = application;
    self._substance = substance;
    self._year = year;
    self._scenarioName = scenarioName;
    self._trialNumber = trialNumber;
    self._manufactureValue = manufactureValue;
    self._importValue = importValue;
    self._exportValue = exportValue;
    self._recycleValue = recycleValue;
    self._domesticConsumptionValue = domesticConsumptionValue;
    self._importConsumptionValue = importConsumptionValue;
    self._exportConsumptionValue = exportConsumptionValue;
    self._recycleConsumptionValue = recycleConsumptionValue;
    self._populationValue = populationValue;
    self._populationNew = populationNew;
    self._rechargeEmissions = rechargeEmissions;
    self._eolEmissions = eolEmissions;
    self._energyConsumption = energyConsumption;
    self._tradeSupplement = tradeSupplement;
  }

  /**
   * Get the application.
   *
   * @returns {string} The application.
   */
  getApplication() {
    const self = this;
    return self._application;
  }

  /**
   * Get the substance.
   *
   * @returns {string} The substance.
   */
  getSubstance() {
    const self = this;
    return self._substance;
  }

  /**
   * Get the year the result is relevant to.
   *
   * @returns {number} The year.
   */
  getYear() {
    const self = this;
    return self._year;
  }

  /**
   * Get the manufacture value.
   *
   * @returns {EngineNumber} The manufacture value in volume like kg.
   */
  getManufacture() {
    const self = this;
    return self._manufactureValue;
  }

  /**
   * Get the import value.
   *
   * @returns {EngineNumber} The import value in volume like kg.
   */
  getImport() {
    const self = this;
    return self._importValue;
  }

  /**
   * Get the export value.
   *
   * @returns {EngineNumber} The export value in volume like kg.
   */
  getExport() {
    const self = this;
    return self._exportValue;
  }

  /**
   * Get the recycle value.
   *
   * @returns {EngineNumber} The recycle value in volume like kg.
   */
  getRecycle() {
    const self = this;
    return self._recycleValue;
  }

  /**
   * Get the total consumption without recycling.
   *
   * @returns {EngineNumber} The consumption value in tCO2e or similar.
   */
  getConsumptionNoRecycle() {
    const self = this;
    if (self._domesticConsumptionValue.getUnits() !== self._importConsumptionValue.getUnits()) {
      throw "Could not add incompatible units for consumption.";
    }

    return new EngineNumber(
      self._domesticConsumptionValue.getValue() + self._importConsumptionValue.getValue(),
      self._domesticConsumptionValue.getUnits(),
    );
  }

  /**
   * Get the total consumption.
   *
   * @returns {EngineNumber} The consumption value in tCO2e or similar.
   */
  getGhgConsumption() {
    const self = this;

    const noRecycleValue = self.getConsumptionNoRecycle();

    if (self._recycleConsumptionValue.getUnits() !== noRecycleValue.getUnits()) {
      throw "Could not add incompatible units for consumption.";
    }

    return new EngineNumber(
      self._recycleConsumptionValue.getValue() + noRecycleValue.getValue(),
      self._recycleConsumptionValue.getUnits(),
    );
  }

  /**
   * Get the domestic consumption value.
   *
   * @returns {EngineNumber} The domestic consumption value in tCO2e or
   *     similar.
   */
  getDomesticConsumption() {
    const self = this;
    return self._domesticConsumptionValue;
  }

  /**
   * Get the import consumption value.
   *
   * @returns {EngineNumber} The import consumption value.
   */
  getImportConsumption() {
    const self = this;
    return self._importConsumptionValue;
  }

  /**
   * Get the export consumption value.
   *
   * @returns {EngineNumber} The export consumption value.
   */
  getExportConsumption() {
    const self = this;
    return self._exportConsumptionValue;
  }

  /**
   * Get the recycle consumption value.
   *
   * @returns {EngineNumber} The recycle consumption value.
   */
  getRecycleConsumption() {
    const self = this;
    return self._recycleConsumptionValue;
  }

  /**
   * Get the population value.
   *
   * @returns {EngineNumber} The population value.
   */
  getPopulation() {
    const self = this;
    return self._populationValue;
  }

  /**
   * Get the amount of new equipment added this year.
   *
   * @returns {EngineNumber} The amount of new equipment this year in units.
   */
  getPopulationNew() {
    const self = this;
    return self._populationNew;
  }

  /**
   * Get the greenhouse gas emissions from recharge activities.
   *
   * @returns {EngineNumber} The recharge emissions value with units.
   */
  getRechargeEmissions() {
    const self = this;
    return self._rechargeEmissions;
  }

  /**
   * Get the greenhouse gas emissions from end-of-life equipment.
   *
   * @returns {EngineNumber} The end-of-life emissions value with units.
   */
  getEolEmissions() {
    const self = this;
    return self._eolEmissions;
  }

  /**
   * Get the energy consumption value.
   *
   * @returns {EngineNumber} The energy consumption value with units.
   */
  getEnergyConsumption() {
    const self = this;
    return self._energyConsumption;
  }

  /**
   * Get the trade supplement information.
   *
   * @returns {TradeSupplement} The additional trade information needed for
   *     attribution.
   */
  getTradeSupplement() {
    const self = this;
    return self._tradeSupplement;
  }


  /**
   * Get the scenario name.
   *
   * @returns {string} The name of the scenario being run.
   */
  getScenarioName() {
    const self = this;
    return self._scenarioName;
  }

  /**
   * Get the trial number.
   *
   * @returns {number} The trial number of the current run.
   */
  getTrialNumber() {
    const self = this;
    return self._trialNumber;
  }
}

/**
 * Decorator which attributes initial charge to the exporter.
 *
 * Decorator which attributes initial charge to the exporter which is in
 * contrast to the default where initial chanrge is included for the importer
 * totals. Leaves other attributes including population and all domestic
 * calculations unchanged. This represents a single substance and application
 * in a single year with attribution added.
 */
class AttributeToExporterResult {
  /**
   * Create a new decorator around a raw result with importer attribution.
   *
   * @param {EngineResult} inner - The value to be decorated that will apply
   *     trade attribution to exporter at time of request.
   */
  constructor(inner) {
    const self = this;
    self._inner = inner;
  }

  /**
   * Get the application for which results are reported.
   *
   * @returns {string} The unchanged application from the decorated result.
   */
  getApplication() {
    const self = this;
    return self._inner.getApplication();
  }

  /**
   * Get the substance for which results are reported.
   *
   * @returns {string} The unchanged substance from the decorated result.
   */
  getSubstance() {
    const self = this;
    return self._inner.getSubstance();
  }

  /**
   * Get the year for which results are reported.
   *
   * @returns {number} The unchanged year from the decorated result.
   */
  getYear() {
    const self = this;
    return self._inner.getYear();
  }

  /**
   * Get the manufacture volume.
   *
   * @returns {EngineNumber} The unchanged manufacture volume in kg or similar
   *     from the decorated result.
   */
  getManufacture() {
    const self = this;
    return self._inner.getManufacture();
  }

  /**
   * Get the import volume associated with this result.
   *
   * @returns {EngineValue} The import volume in kg or similar from the
   *     decorated result but with initial charge attributed to exporter.
   */
  getImport() {
    const self = this;
    const totalImport = self._inner.getImport();
    const tradeSupplement = self._inner.getTradeSupplement();
    const importInitialCharge = tradeSupplement.getImportInitialChargeValue();

    const totalUnits = totalImport.getUnits();
    const initialChargeUnits = importInitialCharge.getUnits();
    if (totalUnits !== initialChargeUnits) {
      const mismatchDescription = "between " + totalUnits + " and " + initialChargeUnits;
      throw "Could not attribute trade due to units mismatch " + mismatchDescription;
    }

    const importInitialChargeValue = importInitialCharge.getValue();
    const effectiveInitialCharge = importInitialChargeValue > 0 ? importInitialChargeValue : 0;
    const innerNumber = totalImport.getValue() - effectiveInitialCharge;
    return new EngineNumber(innerNumber, totalUnits);
  }

  /**
   * Get the recycle volume.
   *
   * @returns {EngineNumber} The unchanged recycle volume in kg or similar
   *     from the decorated result.
   */
  getRecycle() {
    const self = this;
    return self._inner.getRecycle();
  }

  /**
   * Get the total consumption without recycling.
   *
   * @returns {EngineNumber} The unchanged consumption value in tCO2e or similar
   *     from the decorated result, combining domestic and import consumption.
   */
  getConsumptionNoRecycle() {
    const self = this;
    return self._inner.getConsumptionNoRecycle();
  }

  /**
   * Get the total greenhouse gas consumption.
   *
   * @returns {EngineNumber} The total GHG consumption value in tCO2e or similar.
   */
  getGhgConsumption() {
    const self = this;
    return self._inner.getGhgConsumption();
  }

  /**
   * Get the domestic consumption value.
   *
   * @returns {EngineNumber} The domestic consumption value in tCO2e or similar.
   */
  getDomesticConsumption() {
    const self = this;
    return self._inner.getDomesticConsumption();
  }

  /**
   * Get the import consumption value with exporter attribution.
   *
   * @returns {EngineNumber} The import consumption value in tCO2e or similar,
   *     adjusted for exporter attribution by removing initial charge consumption.
   */
  getImportConsumption() {
    const self = this;
    const totalImport = self._inner.getImportConsumption();
    const tradeSupplement = self._inner.getTradeSupplement();
    const importInitialCharge = tradeSupplement.getImportInitialChargeConsumption();

    const totalUnits = totalImport.getUnits();
    const initialChargeUnits = importInitialCharge.getUnits();
    if (totalUnits !== initialChargeUnits) {
      const mismatchDescription = "between " + totalUnits + " and " + initialChargeUnits;
      throw "Could not attribute trade due to units mismatch " + mismatchDescription;
    }

    const importInitialChargeValue = importInitialCharge.getValue();
    const effectiveInitialCharge = importInitialChargeValue > 0 ? importInitialChargeValue : 0;
    const innerNumber = totalImport.getValue() - effectiveInitialCharge;
    return new EngineNumber(innerNumber, totalUnits);
  }

  /**
   * Get the recycle consumption value.
   *
   * @returns {EngineNumber} The recycle consumption value in tCO2e or similar.
   */
  getRecycleConsumption() {
    const self = this;
    return self._inner.getRecycleConsumption();
  }

  /**
   * Get the population value.
   *
   * @returns {EngineNumber} The population value in terms of equipment units.
   */
  getPopulation() {
    const self = this;
    return self._inner.getPopulation();
  }

  /**
   * Get the amount of new equipment added this year.
   *
   * @returns {EngineNumber} The amount of new equipment added this year in units.
   */
  getPopulationNew() {
    const self = this;
    return self._inner.getPopulationNew();
  }

  /**
   * Get the greenhouse gas emissions from recharge activities.
   *
   * @returns {EngineNumber} The recharge emissions value in tCO2e or similar.
   */
  getRechargeEmissions() {
    const self = this;
    return self._inner.getRechargeEmissions();
  }

  /**
   * Get the greenhouse gas emissions from end-of-life equipment.
   *
   * @returns {EngineNumber} The end-of-life emissions value in tCO2e or similar.
   */
  getEolEmissions() {
    const self = this;
    return self._inner.getEolEmissions();
  }

  /**
   * Get the energy consumption value.
   *
   * @returns {EngineNumber} The energy consumption value with units.
   */
  getEnergyConsumption() {
    const self = this;
    return self._inner.getEnergyConsumption();
  }

  /**
   * Get the import supplement information.
   *
   * @returns {ImportSupplement} The additional import information needed for
   *     attribution from the decorated result.
   */
  getTradeSupplement() {
    const self = this;
    return self._inner.getTradeSupplement();
  }

  /**
   * Get the scenario name.
   *
   * @returns {string} The name of the scenario being run.
   */
  getScenarioName() {
    const self = this;
    return self._inner.getScenarioName();
  }

  /**
   * Get the trial number.
   *
   * @returns {number} The trial number of the current run.
   */
  getTrialNumber() {
    const self = this;
    return self._inner.getTrialNumber();
  }

  /**
   * Get the export volume associated with this result.
   *
   * @returns {EngineValue} The export volume in kg or similar from the
   *     decorated result but with initial charge attributed to exporter.
   */
  getExport() {
    const self = this;
    const totalExport = self._inner.getExport();
    const tradeSupplement = self._inner.getTradeSupplement();
    const exportInitialCharge = tradeSupplement.getExportInitialChargeValue();

    const totalUnits = totalExport.getUnits();
    const initialChargeUnits = exportInitialCharge.getUnits();
    if (totalUnits !== initialChargeUnits) {
      const mismatchDescription = "between " + totalUnits + " and " + initialChargeUnits;
      throw "Could not attribute trade due to units mismatch " + mismatchDescription;
    }

    const exportInitialChargeValue = exportInitialCharge.getValue();
    const effectiveInitialCharge = exportInitialChargeValue > 0 ? exportInitialChargeValue : 0;
    const innerNumber = totalExport.getValue() + effectiveInitialCharge;
    return new EngineNumber(innerNumber, totalUnits);
  }

  /**
   * Get the export consumption value with exporter attribution.
   *
   * @returns {EngineNumber} The export consumption value in tCO2e or similar,
   *     adjusted for exporter attribution by adding initial charge consumption.
   */
  getExportConsumption() {
    const self = this;
    const totalExport = self._inner.getExportConsumption();
    const tradeSupplement = self._inner.getTradeSupplement();
    const exportInitialCharge = tradeSupplement.getExportInitialChargeConsumption();

    const totalUnits = totalExport.getUnits();
    const initialChargeUnits = exportInitialCharge.getUnits();
    if (totalUnits !== initialChargeUnits) {
      const mismatchDescription = "between " + totalUnits + " and " + initialChargeUnits;
      throw "Could not attribute trade due to units mismatch " + mismatchDescription;
    }

    const exportInitialChargeValue = exportInitialCharge.getValue();
    const effectiveInitialCharge = exportInitialChargeValue > 0 ? exportInitialChargeValue : 0;
    const innerNumber = totalExport.getValue() + effectiveInitialCharge;
    return new EngineNumber(innerNumber, totalUnits);
  }
}

/**
 * Description of trade activity within a result.
 *
 * As a supplement to an {EngineResult}, offers additional description of trade
 * activity on new equipment (and their initial charge) to support different
 * kinds of trade attributions. This is not reported to the user but is
 * required for some internal calculations prior to aggregation operations. This
 * provides supplemental information for a single application and substance in
 * a single year.
 */
class TradeSupplement {
  /**
   * Create a new summary of trade activities.
   *
   * @param {EngineValue} importInitialChargeValue - The volume of substance imported
   *     via initial charge on imported equipment (like kg).
   * @param {EngineValue} importInitialChargeConsumption - The consumption
   *     associated with initial charge of imported equipment (like tCO2e).
   * @param {EngineValue} importPopulation - The number of new units imported.
   * @param {EngineValue} exportInitialChargeValue - The volume of substance exported
   *     via initial charge on exported equipment (like kg).
   * @param {EngineValue} exportInitialChargeConsumption - The consumption
   *     associated with initial charge of exported equipment (like tCO2e).
   */
  constructor(
    importInitialChargeValue,
    importInitialChargeConsumption,
    importPopulation,
    exportInitialChargeValue,
    exportInitialChargeConsumption,
  ) {
    const self = this;
    self._importInitialChargeValue = importInitialChargeValue;
    self._importInitialChargeConsumption = importInitialChargeConsumption;
    self._importPopulation = importPopulation;
    self._exportInitialChargeValue = exportInitialChargeValue;
    self._exportInitialChargeConsumption = exportInitialChargeConsumption;
  }

  /**
   * Get the volume of substance imported via initial charge on imported equipment.
   *
   * @returns {EngineValue} The import initial charge value in volume units like kg.
   */
  getImportInitialChargeValue() {
    const self = this;
    return self._importInitialChargeValue;
  }

  /**
   * Get the consumption associated with initial charge of imported equipment.
   *
   * @returns {EngineValue} The import initial charge consumption value in units like tCO2e.
   */
  getImportInitialChargeConsumption() {
    const self = this;
    return self._importInitialChargeConsumption;
  }

  /**
   * Get the number of new units imported.
   *
   * @returns {EngineValue} The import population value in units.
   */
  getImportPopulation() {
    const self = this;
    return self._importPopulation;
  }

  /**
   * Get the volume of substance exported via initial charge on exported equipment.
   *
   * @returns {EngineValue} The export initial charge value in volume units like kg.
   */
  getExportInitialChargeValue() {
    const self = this;
    return self._exportInitialChargeValue;
  }

  /**
   * Get the consumption associated with initial charge of exported equipment.
   *
   * @returns {EngineValue} The export initial charge consumption value in units like tCO2e.
   */
  getExportInitialChargeConsumption() {
    const self = this;
    return self._exportInitialChargeConsumption;
  }
}

// Alias for backward compatibility
const ImportSupplement = TradeSupplement;

/**
 * Builder to help construct an EngineResult.
 */
class EngineResultBuilder {
  /**
   * Create builder without any values initalized.
   */
  constructor() {
    const self = this;
    self._application = null;
    self._substance = null;
    self._year = null;
    self._scenarioName = null;
    self._trialNumber = null;
    self._manufactureValue = null;
    self._importValue = null;
    self._exportValue = null;
    self._recycleValue = null;
    self._domesticConsumptionValue = null;
    self._importConsumptionValue = null;
    self._exportConsumptionValue = null;
    self._recycleConsumptionValue = null;
    self._populationValue = null;
    self._populationNew = null;
    self._rechargeEmissions = null;
    self._eolEmissions = null;
    self._energyConsumption = null;
    self._tradeSupplement = null;
  }

  /**
   * Set the application for which a result is being given.
   *
   * @param {string} application - The application to be associated with this
   *     engine result.
   */
  setApplication(application) {
    const self = this;
    self._application = application;
  }

  /**
   * Set the substance for which a result is being given.
   *
   * @param {string} substance - The substance to be associated with this
   *     engine result.
   */
  setSubstance(substance) {
    const self = this;
    self._substance = substance;
  }

  /**
   * Set the year for which a result is being given.
   *
   * @param {number} year - The year to be associated with this engine result.
   */
  setYear(year) {
    const self = this;
    self._year = year;
  }

  /**
   * Set the scenario name for which a result is being given.
   *
   * @param {string} scenarioName - The name of the scenario being run.
   */
  setScenarioName(scenarioName) {
    const self = this;
    self._scenarioName = scenarioName;
  }

  /**
   * Set the trial number for which a result is being given.
   *
   * @param {number} trialNumber - The trial number of the current run.
   */
  setTrialNumber(trialNumber) {
    const self = this;
    self._trialNumber = trialNumber;
  }

  /**
   * Set the manufacture value.
   *
   * @param {EngineNumber} manufactureValue - The value associated with
   *     manufacturing in volume like kg.
   */
  setManufactureValue(manufactureValue) {
    const self = this;
    self._manufactureValue = manufactureValue;
  }

  /**
   * Set the import value.
   *
   * @param {EngineNumber} importValue - The value related to imports like in
   *     volume like kg.
   */
  setImportValue(importValue) {
    const self = this;
    self._importValue = importValue;
  }

  /**
   * Set the export value.
   *
   * @param {EngineNumber} exportValue - The value related to exports like in
   *     volume like kg.
   */
  setExportValue(exportValue) {
    const self = this;
    self._exportValue = exportValue;
  }

  /**
   * Set the recycle value.
   *
   * @param {EngineNumber} recycleValue - The value denoting recycled
   *     materials in volume like kg.
   */
  setRecycleValue(recycleValue) {
    const self = this;
    self._recycleValue = recycleValue;
  }

  /**
   * Set the domestic consumption value.
   *
   * @param {EngineNumber} domesticConsumptionValue - The domestic consumption
   *     value in tCO2e or equivalent.
   */
  setDomesticConsumptionValue(domesticConsumptionValue) {
    const self = this;
    self._domesticConsumptionValue = domesticConsumptionValue;
  }

  /**
   * Set the import consumption value.
   *
   * @param {EngineNumber} importConsumptionValue - The import consumption
   *     value in tCO2e or equivalent.
   */
  setImportConsumptionValue(importConsumptionValue) {
    const self = this;
    self._importConsumptionValue = importConsumptionValue;
  }

  /**
   * Set the export consumption value.
   *
   * @param {EngineNumber} exportConsumptionValue - The export consumption
   *     value in tCO2e or equivalent.
   */
  setExportConsumptionValue(exportConsumptionValue) {
    const self = this;
    self._exportConsumptionValue = exportConsumptionValue;
  }

  /**
   * Set the recycle consumption value.
   *
   * @param {EngineNumber} recycleConsumptionValue - The recycle consumption
   *     value in tCO2e or equivalent.
   */
  setRecycleConsumptionValue(recycleConsumptionValue) {
    const self = this;
    self._recycleConsumptionValue = recycleConsumptionValue;
  }

  /**
   * Set the population value.
   *
   * @param {EngineNumber} populationValue - The population value in terms of
   *     equipment.
   */
  setPopulationValue(populationValue) {
    const self = this;
    self._populationValue = populationValue;
  }

  /**
   * Set the population new value.
   *
   * @param {EngineNumber} populationNew - The amount of new equipment added
   *     this year.
   */
  setPopulationNew(populationNew) {
    const self = this;
    self._populationNew = populationNew;
  }

  /**
   * Set the recharge emissions value.
   *
   * @param {EngineNumber} rechargeEmissions - The greenhouse gas emissions
   *     from recharge activities.
   */
  setRechargeEmissions(rechargeEmissions) {
    const self = this;
    self._rechargeEmissions = rechargeEmissions;
  }

  /**
   * Set the end-of-life emissions value.
   *
   * @param {EngineNumber} eolEmissions - The greenhouse gas emissions from
   *     end-of-life equipment.
   */
  setEolEmissions(eolEmissions) {
    const self = this;
    self._eolEmissions = eolEmissions;
  }

  /**
   * Set the energy consumption value.
   *
   * @param {EngineNumber} energyConsumption - The energy consumption value
   *     with units.
   */
  setEnergyConsumption(energyConsumption) {
    const self = this;
    self._energyConsumption = energyConsumption;
  }

  /**
   * Specify the supplemental trade information needed for attribution.
   *
   * @param {TradeSupplement} tradeSupplement - Supplemental trade
   *     information.
   */
  setTradeSupplement(tradeSupplement) {
    const self = this;
    self._tradeSupplement = tradeSupplement;
  }


  /**
   * Check that the builder is complete and create a new result.
   *
   * @returns {EngineResult} The result built from the values provided to this
   *     builder.
   */
  build() {
    const self = this;
    self._checkReadyToConstruct();
    return new EngineResult(
      self._application,
      self._substance,
      self._year,
      self._scenarioName,
      self._trialNumber,
      self._manufactureValue,
      self._importValue,
      self._exportValue,
      self._recycleValue,
      self._domesticConsumptionValue,
      self._importConsumptionValue,
      self._exportConsumptionValue,
      self._recycleConsumptionValue,
      self._populationValue,
      self._populationNew,
      self._rechargeEmissions,
      self._eolEmissions,
      self._energyConsumption,
      self._tradeSupplement,
    );
  }

  _checkReadyToConstruct() {
    const self = this;

    const checkValid = (value, name) => {
      if (value === null || value === undefined) {
        throw "Could not make engine result because " + name + " was not given.";
      }
    };

    checkValid(self._application, "application");
    checkValid(self._substance, "substance");
    checkValid(self._year, "year");
    checkValid(self._scenarioName, "scenarioName");
    checkValid(self._trialNumber, "trialNumber");
    checkValid(self._manufactureValue, "manufactureValue");
    checkValid(self._importValue, "importValue");
    checkValid(self._exportValue, "exportValue");
    checkValid(self._recycleValue, "recycleValue");
    checkValid(self._domesticConsumptionValue, "domesticConsumptionValue");
    checkValid(self._importConsumptionValue, "importConsumptionValue");
    checkValid(self._exportConsumptionValue, "exportConsumptionValue");
    checkValid(self._recycleConsumptionValue, "recycleConsumptionValue");
    checkValid(self._populationValue, "populationValue");
    checkValid(self._populationNew, "populationNew");
    checkValid(self._rechargeEmissions, "rechargeEmissions");
    checkValid(self._eolEmissions, "eolEmissions");
    checkValid(self._energyConsumption, "energyConsumption");
    checkValid(self._tradeSupplement, "tradeSupplement");
  }
}

/**
 * Statistics from or summary of a group of results.
 *
 * Result for a single group of results after aggregation like for all
 * consumption across all substances in an application.
 */
class AggregatedResult {
  /**
   * Construct an AggregatedResult instance.
   *
   * @param {EngineNumber} manufactureValue - The value representing
   *     manufacturing in volume like kg.
   * @param {EngineNumber} importValue - The value representing imports in
   *     volume like kg.
   * @param {EngineNumber} recycleValue - The value of recycled goods in volume
   *     like kg.
   * @param {EngineNumber} domesticConsumptionValue - The value representing
   *     domestic consumption in tCO2e or similar.
   * @param {EngineNumber} importConsumptionValue - The consumption value due
   *     to imports in tCO2e or similar.
   * @param {EngineNumber} recycleConsumptionValue - The consumption value due
   *     to recycling in tCO2e or similar.
   * @param {EngineNumber} populationValue - The value of the population amount.
   * @param {EngineNumber} populationNew - The value representing new equipment
   *     added in the current year.
   * @param {EngineNumber} rechargeEmissions - Emissions resulting from recharge
   *     activities.
   * @param {EngineNumber} eolEmissions - Emissions resulting from end-of-life
   *     equipment.
   * @param {EngineNumber} energyConsumtion - Equivalent energy consumption for
   *     activity specified.
   */
  constructor(
    manufactureValue,
    importValue,
    recycleValue,
    exportValue,
    domesticConsumptionValue,
    importConsumptionValue,
    recycleConsumptionValue,
    exportConsumptionValue,
    populationValue,
    populationNew,
    rechargeEmissions,
    eolEmissions,
    energyConsumption,
  ) {
    const self = this;
    self._manufactureValue = manufactureValue;
    self._importValue = importValue;
    self._recycleValue = recycleValue;
    self._exportValue = exportValue;
    self._domesticConsumptionValue = domesticConsumptionValue;
    self._importConsumptionValue = importConsumptionValue;
    self._recycleConsumptionValue = recycleConsumptionValue;
    self._exportConsumptionValue = exportConsumptionValue;
    self._populationValue = populationValue;
    self._populationNew = populationNew;
    self._rechargeEmissions = rechargeEmissions;
    self._eolEmissions = eolEmissions;
    self._energyConsumption = energyConsumption;
  }

  /**
   * Get the energy consumption value.
   *
   * @returns {EngineNumber} The energy consumption value with units.
   */
  getEnergyConsumption() {
    const self = this;
    return self._energyConsumption;
  }

  /**
   * Get the manufacture (as opposed to import) of substance.
   *
   * @returns {EngineNumber} The manufacture value with units like kg.
   */
  getManufacture() {
    const self = this;
    return self._manufactureValue;
  }

  /**
   * Get the import (as opposed to manufacture) value.
   *
   * @returns {EngineNumber} The import value with units like kg.
   */
  getImport() {
    const self = this;
    return self._importValue;
  }

  /**
   * Get the recycle sales.
   *
   * @returns {EngineNumber} The recycle sales with units like kg.
   */
  getRecycle() {
    const self = this;
    return self._recycleValue;
  }

  /**
   * Get the export sales.
   *
   * @returns {EngineNumber} The export sales with units like kg.
   */
  getExport() {
    const self = this;
    return self._exportValue;
  }

  /**
   * Get combined sales value (manufacture + import).
   *
   * @returns {EngineNumber} The combined sales value with units like kg.
   */
  getSales() {
    const self = this;
    const manufactureValue = self.getManufacture();
    const importValue = self.getImport();
    const recycleValue = self.getRecycle();
    const noRecycle = self._combineUnitValue(manufactureValue, importValue);
    const sales = self._combineUnitValue(noRecycle, recycleValue);
    return sales;
  }

  /**
   * Get the domestic consumption value.
   *
   * @returns {EngineNumber} The domestic consumption value with units like
   *     tCO2e.
   */
  getDomesticConsumption() {
    const self = this;
    return self._domesticConsumptionValue;
  }

  /**
   * Get the import consumption value.
   *
   * @returns {EngineNumber} The import consumption value.
   */
  getImportConsumption() {
    const self = this;
    return self._importConsumptionValue;
  }

  /**
   * Get the recycle consumption.
   *
   * @returns {EngineNumber} The recycle consumption with units like tCO2e.
   */
  getRecycleConsumption() {
    const self = this;
    return self._recycleConsumptionValue;
  }

  /**
   * Get the export consumption.
   *
   * @returns {EngineNumber} The export consumption with units like tCO2e.
   */
  getExportConsumption() {
    const self = this;
    return self._exportConsumptionValue;
  }

  /**
   * Get the total consumption combining domestic and import.
   *
   * @returns {EngineNumber} The combined consumption value with units like
   *     tCO2e.
   */
  getGhgConsumption() {
    const self = this;
    const noRecycle = self._combineUnitValue(
      self.getDomesticConsumption(),
      self.getImportConsumption(),
    );
    return self._combineUnitValue(noRecycle, self.getRecycleConsumption());
  }

  /**
   * Get the population (amount of equipment) value.
   *
   * @returns {EngineNumber} The population value with units like tCO2e.
   */
  getPopulation() {
    const self = this;
    return self._populationValue;
  }

  /**
   * Get the new equipment added in this year.
   *
   * @returns {EngineNumber} The new equipment added in units like tCO2e.
   */
  getPopulationNew() {
    const self = this;
    return self._populationNew;
  }

  /**
   * Get the greenhouse gas emissions from recharge activities.
   *
   * @returns {EngineNumber} The recharge emissions value with units like
   *     tCO2e.
   */
  getRechargeEmissions() {
    const self = this;
    return self._rechargeEmissions;
  }

  /**
   * Get the greenhouse gas emissions from end-of-life equipment.
   *
   * @returns {EngineNumber} The end-of-life emissions value with units like
   *     tCO2e.
   */
  getEolEmissions() {
    const self = this;
    return self._eolEmissions;
  }

  /**
   * Get the total greenhouse gas emissions combining recharge and end-of-life emissions.
   *
   * @returns {EngineNumber} The combined emissions value with units like tCO2e.
   */
  getTotalEmissions() {
    const self = this;
    return self._combineUnitValue(self.getRechargeEmissions(), self.getEolEmissions());
  }

  /**
   * Combine this result with another result.
   *
   * Combine this result with another result in an additive way with unit
   * standardization and conversion.
   *
   * @param {AggregatedResult} other - The other result to combine with.
   * @returns {AggregatedResult} A new combined result.
   */
  combine(other) {
    const self = this;

    const manufactureValue = self._combineUnitValue(self.getManufacture(), other.getManufacture());
    const importValue = self._combineUnitValue(self.getImport(), other.getImport());
    const recycleValue = self._combineUnitValue(self.getRecycle(), other.getRecycle());
    const exportValue = self._combineUnitValue(self.getExport(), other.getExport());
    const domesticConsumptionValue = self._combineUnitValue(
      self.getDomesticConsumption(),
      other.getDomesticConsumption(),
    );
    const importConsumptionValue = self._combineUnitValue(
      self.getImportConsumption(),
      other.getImportConsumption(),
    );
    const recycleConsumptionValue = self._combineUnitValue(
      self.getRecycleConsumption(),
      other.getRecycleConsumption(),
    );
    const exportConsumptionValue = self._combineUnitValue(
      self.getExportConsumption(),
      other.getExportConsumption(),
    );
    const populationValue = self._combineUnitValue(self.getPopulation(), other.getPopulation());
    const populationNew = self._combineUnitValue(self.getPopulationNew(), other.getPopulationNew());

    const rechargeEmissions = self._combineUnitValue(
      self.getRechargeEmissions(),
      other.getRechargeEmissions(),
    );
    const eolEmissions = self._combineUnitValue(self.getEolEmissions(), other.getEolEmissions());
    const energyConsumption = self._combineUnitValue(
      self.getEnergyConsumption(),
      other.getEnergyConsumption(),
    );

    return new AggregatedResult(
      manufactureValue,
      importValue,
      recycleValue,
      exportValue,
      domesticConsumptionValue,
      importConsumptionValue,
      recycleConsumptionValue,
      exportConsumptionValue,
      populationValue,
      populationNew,
      rechargeEmissions,
      eolEmissions,
      energyConsumption,
    );
  }

  /**
   * Combine two unit values with the same units.
   *
   * @private
   * @param {EngineNumber} a - First value.
   * @param {EngineNumber} b - Second value.
   * @returns {EngineNumber} Combined value.
   * @throws {string} If units don't match.
   */
  _combineUnitValue(a, b) {
    const self = this;
    if (a.getUnits() !== b.getUnits()) {
      throw "Encountered different units during aggregation.";
    }
    return new EngineNumber(a.getValue() + b.getValue(), a.getUnits());
  }
}


export {
  AggregatedResult,
  AttributeToExporterResult,
  EngineResult,
  EngineResultBuilder,
  ImportSupplement,
  TradeSupplement,
};
