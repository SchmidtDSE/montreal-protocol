import {
  EngineNumber,
  UnitConverter,
  ConverterStateGetter,
  OverridingConverterStateGetter,
} from "engine_number";

import {
  YearMatcher,
  VariableManager,
  Scope,
  StreamParameterization,
  StreamKeeper,
} from "engine_state";


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
   */
  setSubstance(newSubstance) {
    const self = this;
    self._scope = self._scope.getWithSubstance(newSubstance);
    self._streamKeeper.ensureSubstance(
      self._scope.getApplication(),
      newSubstance,
    );
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

    self._currentYear += 1;
    self._streamKeeper.copyToPriorEquipment();

    if (self._currentYear > self._endYear) {
      throw "Incremented past end year.";
    }
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
    return self._currentYear == self._endYear;
  }

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
      self._recalcPopulationChange();
      self._recalcEmissions();
    } else if (name === "emissions") {
      self._recalcSales();
      self._recalcPopulationChange();
    } else if (name === "equipment") {
      self._recalcSales();
      self._recalcEmissions();
    } else if (name === "priorEqipment") {
      self._recalcPopulationChange();
    }
  }

  getStream(name, scope) {
    const self = this;
    const scopeEffective = scope === undefined ? self._scope : scope;
    const application = scopeEffective.getApplication();
    const substance = scopeEffective.getSubstance();
    return self._streamKeeper.getStream(application, substance, name);
  }

  getVariable(name) {
    const self = this;
    return self._scope.getVariable(name);
  }

  setVariable(name, value) {
    const self = this;
    self._scope.setVariable(name, value);
  }

  _recalcPopulationChange() {
    const self = this;

    const stateGetter = new OverridingConverterStateGetter(self._stateGetter);
    const unitConverter = new UnitConverter(stateGetter);
    const application = self._scope.getApplication();
    const substance = self._scope.getSubstance();

    if (application === null || substance === null) {
      throw "Tried recalculating population change without application and substance.";
    }

    // Get prior popoulation
    const priorPopulationRaw = self.getStream("priorEquipment");
    const priorPopulation = unitConverter.convert(priorPopulationRaw, "units");
    stateGetter.setPopulation(priorPopulation);

    // Get retirement from prior population.
    const retirementRaw = self._streamKeeper.getRetirementRate(
      application,
      substance,
    );
    const retiredPopulation = unitConverter.convert(retirementRaw, "units");

    // Get substance sales
    const substanceSalesRaw = self.getStream("sales");
    const substanceSales = self._unitConverter.convert(substanceSalesRaw, "kg");

    // Get recycling population
    const recoveryVolumeRaw = self._streamKeeper.getRecoveryRate(
      application,
      substance,
    );
    const recoveryVolume = self._unitConverter.convert(recoveryVolumeRaw, "kg");

    // Get recycling amount
    stateGetter.setVolume(recoveryVolume);
    const recycledVolumeRaw = self._streamKeeper.getYieldRate(
      application,
      substance,
    );
    const recycledVolume = unitConverter.convert(recoveryRaw, "kg");
    stateGetter.setVolume(null);

    // Get recharge population
    const rechargePopRaw = self._streamKeeper.getRechargePopulation(
      application,
      substance,
    );
    const rechargePop = unitConverter.convert(rechargePopRaw, "units");

    // Get recharge amount
    stateGetter.setPopulation(rechargePop);
    const rechargeIntensityRaw = self._streamKeeper.getRechargeIntensity(
      application,
      substance,
    );
    const rechargeVolume = unitConverter.convert(rechargeIntensityRaw, "kg");
    stateGetter.setPopulation(priorPopulation);

    // Get total volume available for new units
    const salesKg = substanceSales.getVolume();
    const recycledKg = recycledVolume.getVolume();
    const rechargeKg = rechargeVolume.getVolume();
    const availableForNewUnitsKg = salesKg + recycledKg - rechargeKg;

    // Convert to unit delta
    const initialChargeRaw = self._streamKeeper.getInitialCharge(
      application,
      substance,
    );
    const initialCharge = unitConverter.convert(initialChargeRaw, "kg / unit");
    const initialChargeKgUnit = initialCharge.getValue();
    const deltaUnits = availableForNewUnitsKg / initialChargeKgUnit;

    // Find new total
    const priorPopulationUnits = priorPopulation.getValue();
    const newUnits = priorPopulationUnits + deltaUnits;
    const newUnitsAllowed = newUnitsAllowed < 0 ? 0 : newUnitsAllowed;
    const newVolume = new EngineNumber(newUnitsAllowed, "units");

    // Save
    self.setStream("equipment", newVolume, null, null, false);
  }

  _recalcEmissions() {
    const self = this;
    // Remove recycling
    // Convert
  }

  _recalcSales() {
    const self = this;
    // Add recharge
    // Add
  }
}

export { Engine };
