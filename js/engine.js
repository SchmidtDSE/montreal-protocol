import {
  EngineNumber,
  UnitConverter,
  ConverterStateGetter,
  OverridingConverterStateGetter,
} from "engine_number";

import {Scope, StreamKeeper} from "engine_state";

const STREAM_NAMES = new Set([
  "priorEquipment",
  "equipment",
  "export",
  "import",
  "manufacture",
  "sales",
]);

/**
 * Result of an engine execution for a substance for an application and year.
 */
class EngineResult {
  /**
   * Create an EngineResult.
   *
   * @param {string} application - The application associated with the result.
   * @param {string} substance - The substance associated with the result.
   * @param {number} year - The year the result is relevant to.
   * @param {EngineNumber} manufactureValue - The manufacture value.
   * @param {EngineNumber} importValue - The import value.
   * @param {EngineNumber} consumptionValue - The consumption value.
   * @param {EngineNumber} populationValue - The population value.
   */
  constructor(
    application,
    substance,
    year,
    manufactureValue,
    importValue,
    consumptionValue,
    populationValue,
  ) {
    const self = this;
    self._application = application;
    self._substance = substance;
    self._year = year;
    self._manufactureValue = manufactureValue;
    self._importValue = importValue;
    self._consumptionValue = consumptionValue;
    self._populationValue = populationValue;
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
   * @returns {EngineNumber} The manufacture value.
   */
  getManufacture() {
    const self = this;
    return self._manufactureValue;
  }

  /**
   * Get the import value.
   * 
   * @returns {EngineNumber} The import value.
   */
  getImport() {
    const self = this;
    return self._importValue;
  }

  /**
   * Get the consumption value.
   * 
   * @returns {EngineNumber} The consumption value.
   */
  getConsumption() {
    const self = this;
    return self._consumptionValue;
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
}

/**
 * Facade which runs engine mechanics.
 */
class Engine {

  /**
   * Create a new engine running from
   */
  constructor(startYear, endYear) {
    const self = this;
    self._startYear = startYear;
    self._endYear = endYear;
    self._currentYear = self._startYear;

    self._stateGetter = new ConverterStateGetter(self);
    self._unitConverter = new UnitConverter(self._stateGetter);
    self._streamKeeper = new StreamKeeper(self._unitConverter);
    self._scope = new Scope(null, null, null);
  }

  /**
   * Get the starting year of the simulation.
   *
   * @returns {number} The start year.
   */
  getStartYear() {
    const self = this;
    return self._startYear;
  }

  /**
   * Get the ending year of the simulation.
   *
   * @returns {number} The start year.
   */
  getEndYear() {
    const self = this;
    return self._endYear;
  }

  /**
   * Set the stanza for the engine current scope.
   *
   * @param newStanza The new stanza name.
   */
  setStanza(newStanza) {
    const self = this;
    self._scope = self._scope.getWithStanza(newStanza);
  }

  /**
   * Set the application for the engine current scope.
   *
   * @param newApplication The new application name.
   */
  setApplication(newApplication) {
    const self = this;
    self._scope = self._scope.getWithApplication(newApplication);
  }

  /**
   * Set the substance for the engine current scope.
   *
   * @param newSubstance The new application name.
   * @param checkValid True if an error should be thrown if the app / substance is not previously
   *    registered or false if it should be registered if not found. Defaults to false.
   */
  setSubstance(newSubstance, checkValid) {
    const self = this;
    self._scope = self._scope.getWithSubstance(newSubstance);

    if (checkValid === undefined) {
      checkValid = false;
    }

    const application = self._scope.getApplication();

    if (checkValid) {
      const knownSubstance = self._streamKeeper.hasSubstance(application, newSubstance);
      if (!knownSubstance) {
        throw "Tried accessing unknown app / substance pair: " + application + ", " + newSubstance;
      }
    } else {
      self._streamKeeper.ensureSubstance(application, newSubstance);
    }
  }

  /**
   * Get the engine's current scope.
   *
   * @return Scope object.
   */
  getScope() {
    const self = this;
    return self._scope;
  }

  /**
   * Increment the engine to simulate the next year.
   */
  incrementYear() {
    const self = this;

    if (self.getIsDone()) {
      throw "Already completed.";
    }

    self._currentYear += 1;
    self._streamKeeper.incrementYear();
  }

  /**
   * Get the year that the engine is currently simulating.
   *
   * @returns Current year simulating.
   */
  getYear() {
    const self = this;
    return self._currentYear;
  }

  /**
   * Determine if the engine has reached its final year.
   *
   * @returns True if reached the end year and false otherwise.
   */
  getIsDone() {
    const self = this;
    return self._currentYear > self._endYear;
  }

  /**
   * Set the value of a stream.
   *
   * @param {string} name - The name of the stream to set.
   * @param {EngineNumber} value - The value to set for the stream.
   * @param {Object|null} yearMatcher - The year matcher object to determine if
   *     setting the stream applies to the current year, or null. No-op if the
   *     year matcher is not satisifed.
   * @param {Scope} scope - The scope in which the stream is being set. Uses
   *     default scope if not provided.
   * @param {boolean} propagateChanges - Specifies if changes should propagate
   *     to other components. Defaults to true.
   */
  setStream(name, value, yearMatcher, scope, propagateChanges) {
    const self = this;

    const noYearMatcher = yearMatcher === undefined || yearMatcher === null;
    const inRange = noYearMatcher || yearMatcher.getInRange(self._currentYear);
    if (!inRange) {
      return;
    }

    const useDefaultScope = scope === undefined || scope === null;
    const scopeEffective = useDefaultScope ? self._scope : scope;
    const application = scopeEffective.getApplication();
    const substance = scopeEffective.getSubstance();

    if (application === null || substance === null) {
      throw "Tried setting stream without application and substance specified.";
    }

    self._streamKeeper.setStream(application, substance, name, value);

    if (propagateChanges === undefined || propagateChanges === null) {
      propagateChanges = true;
    }

    if (!propagateChanges) {
      return;
    }

    if (name === "sales" || name === "manufacture" || name === "import") {
      self._recalcPopulationChange(scopeEffective);
      self._recalcConsumption(scopeEffective);
    } else if (name === "consumption") {
      self._recalcSales(scopeEffective);
      self._recalcPopulationChange(scopeEffective);
    } else if (name === "equipment") {
      self._recalcSales(scopeEffective);
      self._recalcConsumption(scopeEffective);
    } else if (name === "priorEquipment") {
      self._recalcRetire(scopeEffective);
    }
  }

  /**
   * Get the stream value for a given application and substance scope.
   *
   * @param {string} name - The name of the stream to retrieve.
   * @param {Scope} scope - The scope within which the stream exists. Uses
   *     default scope if not provided.
   * @param {Object|null} conversion - The conversion specification for units,
   *     or null for no conversion.
   * @returns {EngineNumber} The value of the stream, possibly converted.
   */
  getStream(name, scope, conversion) {
    const self = this;
    const scopeEffective = scope === undefined || scope === null ? self._scope : scope;
    const application = scopeEffective.getApplication();
    const substance = scopeEffective.getSubstance();
    const value = self._streamKeeper.getStream(application, substance, name);

    if (conversion === undefined || conversion === null) {
      return value;
    } else {
      return self._unitConverter.convert(value, conversion);
    }
  }

  defineVariable(name) {
    const self = this;
    if (name === "yearsElapsed" || name === "yearAbsolute") {
      throw "Cannot override yearsElapsed or yearAbsolute.";
    }
    self._scope.defineVariable(name);
  }

  getVariable(name) {
    const self = this;
    if (name === "yearsElapsed") {
      return self._currentYear - self._startYear;
    } else if (name === "yearAbsolute") {
      return self._currentYear;
    } else {
      return self._scope.getVariable(name);
    }
  }

  setVariable(name, value) {
    const self = this;
    if (name === "yearsElapsed" || name === "yearAbsolute") {
      throw "Cannot set yearsElapsed or yearAbsolute.";
    }
    self._scope.setVariable(name, value);
  }

  getInitialCharge(stream) {
    const self = this;

    if (stream === "sales") {
      const manufactureRaw = self.getStream("manufacture");
      const manufactureValue = self._unitConverter.convert(manufactureRaw, "kg");

      const importRaw = self.getStream("import");
      const importValue = self._unitConverter.convert(importRaw, "kg");

      const total = manufactureValue.getValue() + importValue.getValue();
      const emptyStreams = total == 0;

      const manufactureInitialChargeRaw = self.getInitialCharge("manufacture");
      const manufactureInitialCharge = self._unitConverter.convert(
        manufactureInitialChargeRaw,
        "kg / unit",
      );
      const importInitialChargeRaw = self.getInitialCharge("import");
      const importInitialCharge = self._unitConverter.convert(importInitialChargeRaw, "kg / unit");

      const manufactureKg = emptyStreams ? 1 : manufactureValue.getValue();
      const importKg = emptyStreams ? 1 : importValue.getValue();
      const manufactureKgUnit = manufactureInitialCharge.getValue();
      const importKgUnit = importInitialCharge.getValue();
      const manufactureUnits = manufactureKgUnit == 0 ? 0 : manufactureKg / manufactureKgUnit;
      const importUnits = importKgUnit == 0 ? 0 : importKg / importKgUnit;
      const newSumWeighted = manufactureKgUnit * manufactureUnits + importKgUnit * importUnits;
      const newSumWeight = manufactureUnits + importUnits;
      const pooledKgUnit = newSumWeighted / newSumWeight;
      return new EngineNumber(pooledKgUnit, "kg / unit");
    } else {
      const application = self._scope.getApplication();
      const substance = self._scope.getSubstance();
      return self._streamKeeper.getInitialCharge(application, substance, stream);
    }
  }

  setInitialCharge(value, stream, yearMatcher) {
    const self = this;

    if (!self._getIsInRange(yearMatcher)) {
      return;
    }

    if (stream === "sales") {
      self.setInitialCharge(value, "manufacture");
      self.setInitialCharge(value, "import");
    } else {
      const application = self._scope.getApplication();
      const substance = self._scope.getSubstance();
      self._streamKeeper.setInitialCharge(application, substance, stream, value);
    }

    self._recalcPopulationChange();
  }

  getRechargeVolume() {
    const self = this;
    const application = self._scope.getApplication();
    const substance = self._scope.getSubstance();
    return self._streamKeeper.getRechargeVolume(application, substance);
  }

  getRechargeIntensity() {
    const self = this;
    const application = self._scope.getApplication();
    const substance = self._scope.getSubstance();
    return self._streamKeeper.getRechargeIntensity(application, substance);
  }

  recharge(volume, intensity, yearMatcher) {
    const self = this;

    if (!self._getIsInRange(yearMatcher)) {
      return;
    }

    // Setup
    const application = self._scope.getApplication();
    const substance = self._scope.getSubstance();

    // Check allowed
    if (application === null || substance === null) {
      throw "Tried recalculating population change without application and substance.";
    }

    // Set values
    self._streamKeeper.setRechargePopulation(application, substance, volume);
    self._streamKeeper.setRechargeIntensity(application, substance, intensity);

    // Recalculate
    self._recalcPopulationChange();
    self._recalcSales();
    self._recalcConsumption();
  }

  retire(amount, yearMatcher) {
    const self = this;

    if (!self._getIsInRange(yearMatcher)) {
      return;
    }

    const application = self._scope.getApplication();
    const substance = self._scope.getSubstance();
    self._streamKeeper.setRetirementRate(application, substance, amount);
    self._recalcRetire();
  }

  getRetirementRate() {
    const self = this;
    const application = self._scope.getApplication();
    const substance = self._scope.getSubstance();
    return self._streamKeeper.getRetirementRate(application, substance);
  }

  recycle(recoveryWithUnits, yieldWithUnits, displaceLevel, yearMatcher) {
    const self = this;

    if (!self._getIsInRange(yearMatcher)) {
      return;
    }

    const application = self._scope.getApplication();
    const substance = self._scope.getSubstance();
    self._streamKeeper.setRecoveryRate(application, substance, recoveryWithUnits);
    self._streamKeeper.setYieldRate(application, substance, yieldWithUnits);

    if (displaceLevel !== null && displaceLevel !== undefined) {
      self._streamKeeper.setDisplacementRate(application, substance, displaceLevel);
    }

    self._recalcSales();
    self._recalcPopulationChange();
    self._recalcConsumption();
  }

  equals(amount, yearMatcher) {
    const self = this;

    if (!self._getIsInRange(yearMatcher)) {
      return;
    }

    const application = self._scope.getApplication();
    const substance = self._scope.getSubstance();
    self._streamKeeper.setGhgIntensity(application, substance, amount);

    self._recalcConsumption();
  }

  changeStream(stream, amount, yearMatcher, scope) {
    const self = this;

    if (!self._getIsInRange(yearMatcher)) {
      return;
    }

    const currentValue = self.getStream(stream, scope);
    const unitConverter = self._createUnitConverterWithTotal(stream);

    const convertedDelta = unitConverter.convert(amount, currentValue.getUnits());
    const newAmount = currentValue.getValue() + convertedDelta.getValue();
    const outputWithUnits = new EngineNumber(newAmount, currentValue.getUnits());
    self.setStream(stream, outputWithUnits, null, scope);
  }

  cap(stream, amount, yearMatcher, displaceTarget) {
    const self = this;

    if (!self._getIsInRange(yearMatcher)) {
      return;
    }

    const unitConverter = self._createUnitConverterWithTotal(stream);

    const currentValueRaw = self.getStream(stream);
    const currentValue = unitConverter.convert(currentValueRaw, "kg");

    const convertedMax = unitConverter.convert(amount, "kg");
    const changeAmountRaw = convertedMax.getValue() - currentValue.getValue();
    const changeAmount = Math.min(changeAmountRaw, 0);

    const changeWithUnits = new EngineNumber(changeAmount, "kg");
    self.changeStream(stream, changeWithUnits);

    if (displaceTarget !== null && displaceTarget !== undefined) {
      const displaceChange = new EngineNumber(changeAmount * -1, "kg");
      const isStream = STREAM_NAMES.has(displaceTarget);

      if (isStream) {
        self.changeStream(displaceTarget, displaceChange);
      } else {
        const destinationScope = self._scope.getWithSubstance(displaceTarget);
        self.changeStream(stream, displaceChange, null, destinationScope);
      }
    }
  }

  floor(stream, amount, yearMatcher, displaceTarget) {
    const self = this;

    if (!self._getIsInRange(yearMatcher)) {
      return;
    }

    const unitConverter = self._createUnitConverterWithTotal(stream);

    const currentValueRaw = self.getStream(stream);
    const currentValue = unitConverter.convert(currentValueRaw, "kg");

    const convertedMin = unitConverter.convert(amount, "kg");
    const changeAmountRaw = convertedMin.getValue() - currentValue.getValue();
    const changeAmount = Math.max(changeAmountRaw, 0);

    const changeWithUnits = new EngineNumber(changeAmount, "kg");
    self.changeStream(stream, changeWithUnits);

    if (displaceTarget !== null && displaceTarget !== undefined) {
      const displaceChange = new EngineNumber(changeAmount * -1, "kg");
      const isStream = STREAM_NAMES.has(displaceTarget);

      if (isStream) {
        self.changeStream(displaceTarget, displaceChange);
      } else {
        const destinationScope = self._scope.getWithSubstance(displaceTarget);
        self.changeStream(stream, displaceChange, null, destinationScope);
      }
    }
  }

  replace(amountRaw, stream, destinationSubstance, yearMatcher) {
    const self = this;

    if (!self._getIsInRange(yearMatcher)) {
      return;
    }

    const unitConverter = self._createUnitConverterWithTotal(stream);
    const amount = unitConverter.convert(amountRaw, "kg");

    const amountNegative = new EngineNumber(-1 * amount.getValue(), amount.getUnits());
    self.changeStream(stream, amountNegative);

    const destinationScope = self._scope.getWithSubstance(destinationSubstance);
    self.changeStream(stream, amount, null, destinationScope);
  }

  getResults() {
    const self = this;

    const substances = self._streamKeeper.getRegisteredSubstances();

    return substances.map((substanceId) => {
      const application = substanceId.getApplication();
      const substance = substanceId.getSubstance();
      const year = self._currentYear;
      const manufactureValue = self._streamKeeper.getStream(application, substance, "manufacture");
      const importValue = self._streamKeeper.getStream(application, substance, "import");
      const consumptionValue = self._streamKeeper.getStream(application, substance, "consumption");
      const populationValue = self._streamKeeper.getStream(application, substance, "equipment");

      return new EngineResult(
        application,
        substance,
        year,
        manufactureValue,
        importValue,
        consumptionValue,
        populationValue,
      );
    });
  }

  _createUnitConverterWithTotal(stream) {
    const self = this;

    const stateGetter = new OverridingConverterStateGetter(self._stateGetter);
    const unitConverter = new UnitConverter(stateGetter);

    const currentValue = self.getStream(stream);
    stateGetter.setTotal(stream, currentValue);

    const isSalesSubstream = stream === "manufacture" || stream === "import";
    if (isSalesSubstream) {
      stateGetter.setAmortizedUnitVolume(self.getInitialCharge(stream));
    }

    return unitConverter;
  }

  _getIsInRange(yearMatcher) {
    const self = this;
    const noYearMatcher = yearMatcher === undefined || yearMatcher === null;
    const inRange = noYearMatcher || yearMatcher.getInRange(self._currentYear);
    return inRange;
  }

  _recalcPopulationChange(scope) {
    const self = this;

    const stateGetter = new OverridingConverterStateGetter(self._stateGetter);
    const unitConverter = new UnitConverter(stateGetter);
    const scopeEffective = scope === null || scope === undefined ? self._scope : scope;
    const application = scopeEffective.getApplication();
    const substance = scopeEffective.getSubstance();

    if (application === null || substance === null) {
      throw "Tried recalculating population change without application and substance.";
    }

    // Get prior popoulation
    const priorPopulationRaw = self.getStream("priorEquipment", scopeEffective);
    const priorPopulation = unitConverter.convert(priorPopulationRaw, "units");
    stateGetter.setPopulation(priorPopulation);

    // Get substance sales
    const substanceSalesRaw = self.getStream("sales", scopeEffective);
    const substanceSales = unitConverter.convert(substanceSalesRaw, "kg");

    // Get recharge population
    stateGetter.setPopulation(self.getStream("priorEquipment", scopeEffective));
    const rechargePopRaw = self._streamKeeper.getRechargePopulation(application, substance);
    const rechargePop = unitConverter.convert(rechargePopRaw, "units");
    stateGetter.setPopulation(null);

    // Switch to recharge population
    stateGetter.setPopulation(rechargePop);

    // Get recharge amount
    const rechargeIntensityRaw = self._streamKeeper.getRechargeIntensity(application, substance);
    const rechargeVolume = unitConverter.convert(rechargeIntensityRaw, "kg");

    // Get recycling volume
    stateGetter.setVolume(rechargeVolume);
    const recoveryVolumeRaw = self._streamKeeper.getRecoveryRate(application, substance);
    const recoveryVolume = unitConverter.convert(recoveryVolumeRaw, "kg");
    stateGetter.setVolume(null);

    // Get recycling amount
    stateGetter.setVolume(recoveryVolume);
    const recycledVolumeRaw = self._streamKeeper.getYieldRate(application, substance);
    const recycledVolume = unitConverter.convert(recycledVolumeRaw, "kg");
    stateGetter.setVolume(null);

    // Return to prior population
    stateGetter.setPopulation(priorPopulation);

    // Get total volume available for new units
    const salesKg = substanceSales.getValue();
    const recycledKg = recycledVolume.getValue();
    const rechargeKg = rechargeVolume.getValue();

    const displacementRateRaw = self._streamKeeper.getDisplacementRate(application, substance);
    const displacementRate = unitConverter.convert(displacementRateRaw, "%");
    const displacementRateRatio = 1 - displacementRate.getValue() / 100;
    const recycledNonDisplaced = recycledKg * displacementRateRatio;
    const availableForNewUnitsKg = salesKg + recycledNonDisplaced - rechargeKg;

    // Convert to unit delta
    const initialChargeRaw = self.getInitialCharge("sales");
    const initialCharge = unitConverter.convert(initialChargeRaw, "kg / unit");
    const initialChargeKgUnit = initialCharge.getValue();
    const deltaUnits = availableForNewUnitsKg / initialChargeKgUnit;

    // Find new total
    const priorPopulationUnits = priorPopulation.getValue();
    const newUnits = priorPopulationUnits + deltaUnits;
    const newUnitsAllowed = newUnits < 0 ? 0 : newUnits;
    const newVolume = new EngineNumber(newUnitsAllowed, "units");

    // Save
    self.setStream("equipment", newVolume, null, scopeEffective, false);
  }

  _recalcConsumption(scope) {
    const self = this;

    const scopeEffective = scope === null || scope === undefined ? self._scope : scope;

    const stateGetter = new OverridingConverterStateGetter(self._stateGetter);
    const unitConverter = new UnitConverter(stateGetter);
    const application = scopeEffective.getApplication();
    const substance = scopeEffective.getSubstance();

    if (application === null || substance === null) {
      throw "Tried recalculating consumption without application and substance.";
    }

    // Determine percent domestic manufacturing
    const manufacturingRaw = self.getStream("manufacture", scopeEffective);
    const manufacturing = unitConverter.convert(manufacturingRaw, "kg");

    // Determine consumption
    stateGetter.setVolume(manufacturing);
    const consumptionRaw = self._streamKeeper.getGhgIntensity(application, substance);
    const consumption = unitConverter.convert(consumptionRaw, "tCO2e");
    stateGetter.setVolume(null);

    // Ensure in range
    const isNegative = consumption.getValue() < 0;
    const consumptionAllowed = isNegative ? new EngineNumber(0, "tCO2e") : consumption;

    // Save
    self.setStream("consumption", consumptionAllowed, null, scopeEffective, false);
  }

  _recalcSales(scope) {
    const self = this;

    const scopeEffective = scope === null || scope === undefined ? self._scope : scope;

    const stateGetter = new OverridingConverterStateGetter(self._stateGetter);
    const unitConverter = new UnitConverter(stateGetter);
    const application = scopeEffective.getApplication();
    const substance = scopeEffective.getSubstance();

    if (application === null || substance === null) {
      throw "Tried recalculating sales without application and substance.";
    }

    // Get recharge population
    const basePopulation = self.getStream("priorEquipment", scopeEffective);
    stateGetter.setPopulation(basePopulation);
    const rechargePopRaw = self._streamKeeper.getRechargePopulation(application, substance);
    const rechargePop = unitConverter.convert(rechargePopRaw, "units");
    stateGetter.setPopulation(null);

    // Switch into recharge population
    stateGetter.setPopulation(rechargePop);

    // Get recharge amount
    const rechargeIntensityRaw = self._streamKeeper.getRechargeIntensity(application, substance);
    const rechargeVolume = unitConverter.convert(rechargeIntensityRaw, "kg");

    // Determine initial charge
    const initialChargeRaw = self.getInitialCharge("sales");
    const initialCharge = unitConverter.convert(initialChargeRaw, "kg / unit");

    // Get recycling volume
    stateGetter.setVolume(rechargeVolume);
    const recoveryVolumeRaw = self._streamKeeper.getRecoveryRate(application, substance);
    const recoveryVolume = unitConverter.convert(recoveryVolumeRaw, "kg");
    stateGetter.setVolume(null);

    // Get recycling amount
    stateGetter.setVolume(recoveryVolume);
    const recycledVolumeRaw = self._streamKeeper.getYieldRate(application, substance);
    const recycledVolume = unitConverter.convert(recycledVolumeRaw, "kg");
    stateGetter.setVolume(null);

    // Get recycling displaced
    const recycledKg = recycledVolume.getValue();

    const displacementRateRaw = self._streamKeeper.getDisplacementRate(application, substance);
    const displacementRate = unitConverter.convert(displacementRateRaw, "%");
    const displacementRateRatio = displacementRate.getValue() / 100;
    const recycledDisplacedKg = recycledKg * displacementRateRatio;

    // Switch out of recharge population
    stateGetter.setPopulation(null);

    // Determine needs for new equipment deployment.
    stateGetter.setAmortizedUnitVolume(initialCharge);
    const populationChangeRaw = stateGetter.getPopulationChange(self._unitConverter);
    const populationChange = unitConverter.convert(populationChangeRaw, "units");
    const volumeForNew = unitConverter.convert(populationChange, "kg");

    // Get prior popoulation
    const priorPopulationRaw = self.getStream("priorEquipment", scopeEffective);
    const priorPopulation = unitConverter.convert(priorPopulationRaw, "units");
    stateGetter.setPopulation(priorPopulation);

    // Determine sales prior to recycling
    const kgForRecharge = rechargeVolume.getValue();
    const kgForNew = volumeForNew.getValue();
    const kgNoRecycling = kgForRecharge + kgForNew;
    const volumeNoRecycling = new EngineNumber(kgNoRecycling, "kg");

    // Return to original initial charge
    stateGetter.setAmortizedUnitVolume(null);

    // Assume this volume for unit conversion
    stateGetter.setVolume(volumeNoRecycling);

    // Return original
    stateGetter.setVolume(null);

    // Determine sales after recycling
    const kgWithRecycling = kgNoRecycling - recycledDisplacedKg;
    const isNegative = kgWithRecycling < 0;
    const kgWithRecyclingAllowed = isNegative ? 0 : kgWithRecycling;
    const totalSales = new EngineNumber(kgWithRecyclingAllowed, "kg");

    // Update import and domestic sales proportionally.
    self.setStream("sales", totalSales, null, scopeEffective, false);
  }

  _recalcRetire(scope) {
    const self = this;

    // Setup
    const stateGetter = new OverridingConverterStateGetter(self._stateGetter);
    const unitConverter = new UnitConverter(stateGetter);
    const scopeEffective = scope === null || scope === undefined ? self._scope : scope;
    const application = scopeEffective.getApplication();
    const substance = scopeEffective.getSubstance();

    // Check allowed
    if (application === null || substance === null) {
      throw "Tried recalculating population change without application and substance.";
    }

    // Calcuate change
    const currentPriorRaw = self._streamKeeper.getStream(application, substance, "priorEquipment");
    const currentPrior = unitConverter.convert(currentPriorRaw, "units");

    const currentEquipmentRaw = self._streamKeeper.getStream(application, substance, "equipment");
    const currentEquipment = unitConverter.convert(currentEquipmentRaw, "units");

    stateGetter.setPopulation(currentPrior);
    const amountRaw = self._streamKeeper.getRetirementRate(application, substance);
    const amount = unitConverter.convert(amountRaw, "units");
    stateGetter.setPopulation(null);

    const newPrior = new EngineNumber(currentPrior.getValue() - amount.getValue(), "units");
    const newEquipment = new EngineNumber(currentEquipment.getValue() - amount.getValue(), "units");

    // Update streams
    self._streamKeeper.setStream(application, substance, "priorEquipment", newPrior);
    self._streamKeeper.setStream(application, substance, "equipment", newEquipment);

    // Propogate
    self._recalcPopulationChange();
    self._recalcSales();
    self._recalcConsumption();
  }
}

export {Engine};
