const GLOBAL_CONTEXT = 0;
const STANZA_CONTEXT = 1;
const APPLICATION_CONTEXT = 2;
const SUBSTANCE_CONTEXT = 3;

const STREAM_BASE_UNITS = new Map();
STREAM_BASE_UNITS.set("manufacture", "kg");
STREAM_BASE_UNITS.set("import", "kg");
STREAM_BASE_UNITS.set("sales", "kg");
STREAM_BASE_UNITS.set("emissions", "tCO2e");
STREAM_BASE_UNITS.set("equipment", "units");
STREAM_BASE_UNITS.set("priorEquipment", "units");


/**
 * Representation of a number with units within the engine.
 */
class EngineNumber {
  
  /**
   * Create a new number with units.
   *
   * @param value The numeric value (float, or int).
   * @param units The units to associate with this value like kg.
   */
  constructor(value, units) {
    const self = this;
    self._value = value;
    self._units = units;
  }
  
  /**
   * Get the value of this number.
   *
   * @returns Value as an integer or float.
   */
  getValue() {
    const self = this;
    return self._value;
  }
  
  /**
   * Get the units associated with this number.
   *
   * @returns The units as a string like "mt".
   */
  getUnits() {
    const self = this;
    return self._units;
  }
  
}


/**
 * Class representing a range of years where inclusion can be tested.
 */
class YearMatcher {
  
  /**
   * Create a new year range.
   * 
   * Create a new year range between start and end where null in either means positive or negative
   * infinity.
   *
   * @param start The starting year (inclusive) in this range or null if no min year.
   * @param end The ending year (inclusive) in this range or null if no max year.
   */
  constructor(start, end) {
    const self = this;
    self._start = start;
    self._end = end;
  }
  
  /**
   * Determine if a year is included in this range.
   *
   * @param year The year to test for inclusion.
   * @returns True if this value is between getStart and getEnd.
   */
  getInRange(year) {
    const self = this;
    const meetsMin = self._start === null || self._start <= year;
    const meetsMax = self._end === null || self._end >= year;
    return meetsMin && meetsMax;
  }
  
  /**
   * Get the start of the year range.
   *
   * @returns The minimum included year in this range or null if negative infinity.
   */
  getStart() {
    const self = this;
    return self._start;
  }
  
  /**
   * Get the end of the year range.
   *
   * @returns The maximum included year in this range or null if positive infinity.
   */
  getEnd() {
    const self = this;
    return self._end;
  }
  
}


/**
 * Internal object which manages user defined variables at different scopes.
 */
class VariableManager {
  
  /**
   * Create a new variable manager.
   *
   * @param contextLevel The context level constant at which this manager will be used.
   * @param globalContext Map from name of variable to value or undefined if no variables exist at
   *    that global level.
   * @param stanzaContext Map from name of variable to value or undefined if no variables exist at
   *    that stanza level.
   * @param applicationContext Map from name of variable to value or undefined if no variables
   *    exist at that application level.
   * @param substanceContext Map from name of variable to value or undefined if no variables exist
   *    at that substance level.
   */
  constructor(contextLevel, globalContext, stanzaContext, applicationContext, substanceContext) {
    const self = this;
    
    const ensureContext = (x) => x === undefined ? new Map() : x;
    
    self._globalContext = ensureContext(globalContext);
    self._stanzaContext = ensureContext(stanzaContext);
    self._applicationContext = ensureContext(applicationContext);
    self._substanceContext = ensureContext(substanceContext);
    self._contextLevel = contextLevel;
  }
  
  /**
   * Make a new variable manager occupying this namespace but at a different context level.
   *
   * @param contextLevel Constant describing the new context level. If this matches the current 
   *    context level, it is assumed adjacent to the current context.
   * @returns VariableManager at the given context level.
   */
  getWithLevel(contextLevel) {
    const self = this;
    if (contextLevel < GLOBAL_CONTEXT || contextLevel > SUBSTANCE_CONTEXT) {
      throw "Unexpected context level: " + contextLevel;
    }
    
    let newStanzaContext = self._stanzaContext;
    if (contextLevel <= STANZA_CONTEXT) {
      newStanzaContext = new Map();
    }
    
    let newApplicationContext = self._applicationContext;
    if (contextLevel <= APPLICATION_CONTEXT) {
      newApplicationContext = new Map();
    }
    
    let newSubstanceContext = self._substanceContext;
    if (contextLevel <= SUBSTANCE_CONTEXT) {
      newSubstanceContext = new Map();
    }
    
    return new VariableManager(
      contextLevel,
      self._globalContext,
      newStanzaContext,
      newApplicationContext,
      newSubstanceContext
    );
  }
  
  /**
   * Define a new variable in the current context level.
   *
   * Define a new variable in the current context level where an error will be thrown if a variable 
   * of the same name exists at this context level.
   *
   * @param name The name of the variable to define.
   */
  defineVariable(name) {
    const self = this;
    const context = self._getContextForLevel(self._contextLevel);

    if (context.has(name)) {
      throw "Variable already defined in this scope: " + name;
    }

    context.set(name, null);
  }
  
  /**
   * Set the value of a variable already defined.
   *
   * Set the value of a variable already defined where an error will be thrown if a variable of
   * this name has not been defined or is not accessible from the current scope.
   *
   * @param name The name of the variable to be set.
   * @param value The new value of the variable.
   */
  setVariable(name, value) {
    const self = this;
    
    let currentContext = null;
    for (let level = self._contextLevel; level >= GLOBAL_CONTEXT; level--) {
      currentContext = self._getContextForLevel(level);
      if (currentContext.has(name)) {
        currentContext.set(name, value);
        return;
      }
    }
    
    throw "Unable to find variable to set: " + name;
  }
  
  /**
   * Get the value of a variable already defined.
   *
   * Get the value of a variable already defined such that an error will be thrown if a variable of
   * this name has not been defined or is not accessible from the current scope.
   *
   * @param name The name of the variable to be set.
   * @returns Current value of this variable.
   */
  getVariable(name) {
    const self = this;
    
    let currentContext = null;
    for (let level = self._contextLevel; level >= GLOBAL_CONTEXT; level--) {
      currentContext = self._getContextForLevel(level);
      if (currentContext.has(name)) {
        return currentContext.get(name);
      }
    }
    
    throw "Unable to find variable to read: " + name;
  }
  
  /**
   * Get the variable map for a certain context level.
   *
   * @param level Constant corresponding to context level.
   * @returns Map from name of variable to value at the given context level.
   */
  _getContextForLevel(level) {
    const self = this;
    const levelContexts = [
      self._globalContext,
      self._stanzaContext,
      self._applicationContext,
      self._substanceContext
    ];
    return levelContexts[level];
  }
  
}


/**
 * Object defining a scope within the engine including variables accessible from that scope.
 */
class Scope {

  /**
   * Create a new scope.
   *
   * @param stanza The name of stanza or null if in global scope.
   * @param application The name of the application or null if in stanza or higher scope.
   * @param substance The name of the substance or null if in application or higher scope.
   * @param variableManager The variable manager to reach variables accessible from this scope or
   *    undefined if no variables accessible.
   */
  constructor(stanza, application, substance, variableManager) {
    const self = this;
    self._stanza = stanza;
    self._application = application;
    self._substance = substance;
    
    if (self._substance !== null && self._application === null) {
      throw "Cannot specify substance without application.";
    }
    
    if (self._application !== null && self._stanza == null) {
      throw "Cannot specify application without stanza.";
    }
    
    if (variableManager === undefined) {
      const components = [self._stanza, self._application, self._substance];
      const contextLevel = components.filter((x) => x !== null)
        .map((x) => 1)
        .reduce((a, b) => a + b, 0);
      
      variableManager = new VariableManager(contextLevel);
    }
    
    self._variableManager = variableManager;
  }
  
  /**
   * Get the name of the stanza where this scope resides.
   *
   * @return The name of the current stanza or null if in global scope.
   */
  getStanza() {
    const self = this;
    return self._stanza;
  }
  
  /**
   * Get the name of the application where this scope resides.
   *
   * @return The name of the current application or null if in stanza or higher scope.
   */
  getApplication() {
    const self = this;
    return self._application;
  }
  
  /**
   * Get the name of the substance where this scope resides.
   *
   * @return The name of the current substance or null if in application or higher scope.
   */
  getSubstance() {
    const self = this;
    return self._substance;
  }
  
  /**
   * Create a new scope derived from this scope at the substance level.
   *
   * @param newSubstance The name of the substance in which the new scope resides.
   * @returns New scope at the given substance.
   */
  getWithSubstance(newSubstance) {
    const self = this;

    if (self._application === null) {
      throw "Not able to set substance without application.";
    }

    return new Scope(
      self._stanza,
      self._application,
      newSubstance,
      self._variableManager.getWithLevel(SUBSTANCE_CONTEXT)
    );
  }
  
  /**
   * Create a new scope derived from this scope at the application level.
   *
   * @param newSubstance The name of the applicatino in which the new scope resides.
   * @returns New scope at the given application.
   */
  getWithApplication(newApplication) {
    const self = this;
    
    if (self._stanza === null) {
      throw "Not able to set substance without stanza.";
    }
    
    return new Scope(
      self._stanza,
      newApplication,
      null,
      self._variableManager.getWithLevel(APPLICATION_CONTEXT)
    );
  }
  
  /**
   * Create a new scope derived from this scope at the stanza level.
   *
   * @param newSubstance The name of the stanza in which the new scope resides.
   * @returns New scope at the given stanza.
   */
  getWithStanza(newStanza) {
    const self = this;
    
    return new Scope(
      newStanza,
      null,
      null,
      self._variableManager.getWithLevel(STANZA_CONTEXT)
    );
  }
  
  /**
   * Define a variable in the current scope.
   *
   * Define a new variable in the current scope or throw an error if a variable of this name
   * already exists in this scope at the current context level.
   *
   * @param name The name of the variable to define.
   */
  defineVariable(name) {
    const self = this;
    self._variableManager.defineVariable(name);
  }
  
  /**
   * Set the value of a variable already defined.
   *
   * Set the value of a variable or throw an error if no variable of the given name is accessible
   * from the current scope.
   *
   * @param name The name of the variable to set.
   * @param value The new value of the variable.
   */
  setVariable(name, value) {
    const self = this;
    self._variableManager.setVariable(name, value);
  }
  
  /**
   * Get the value of a variable already defined.
   *
   * Get the value of a variable or throw an error if no variable of the given name is accessible
   * from the current scope.
   *
   * @param name The name of the variable to get.
   * @returns Value of the given variable.
   */
  getVariable(name) {
    const self = this;
    return self._variableManager.getVariable(name);
  }

}


/**
 * Object simplifying conversion between units.
 */
class UnitConverter {
  
  /**
   * Create a new unit converter.
   *
   * @param stateGetter Object allowing access to engine state as needed for unit conversion.
   */
  constructor(stateGetter) {
    const self = this;
    self._stateGetter = stateGetter;
  }
  
  /**
   * Convert a number to new units.
   *
   * @param source The EngineNumber to convert.
   * @param destinationUnits The units to which source should be converted.
   */
  convert(source, destinationUnits) {
    const self = this;
    
    if (source.getUnits() === destinationUnits) {
      return source;
    }
    
    const destinationUnitPieces = destinationUnits.split(" / ");
    const destinationNumeratorUnits = destinationUnitPieces[0];
    
    const numeratorStrategy = {
      "kg": (x) => self._toKg(x),
      "mt": (x) => self._toMt(x),
      "unit": (x) => self._toUnits(x),
      "units": (x) => self._toUnits(x),
      "tCO2e": (x) => self._toEmissions(x),
      "year": (x) => self._toYears(x),
      "years": (x) => self._toYears(x),
    }[destinationNumeratorUnits];
    
    const destinationNumerator = numeratorStrategy(source);
    
    const hasDenominator = destinationUnitPieces.length > 1;
    const destinationDenominatorUnits = hasDenominator ? destinationUnitPieces[1] : "";
    if (hasDenominator) {
      const denominatorStrategy = {
        "kg": () => self.convert(self._stateGetter.getVolume(), "kg"),
        "mt": () => self.convert(self._stateGetter.getVolume(), "mt"),
        "unit": () => self.convert(self._stateGetter.getPopulation(), "unit"),
        "units": () => self.convert(self._stateGetter.getPopulation(), "units"),
        "tCO2e": () => self.convert(self._stateGetter.getEmissions(), "tCO2e"),
        "year": () => self.convert(self._stateGetter.getYearsElapsed(), "year"),
        "years": () => self.convert(self._stateGetter.getYearsElapsed(), "years"),
      }[destinationDenominatorUnits];
      const destinationDenominator = denominatorStrategy();
      return new EngineNumber(
        destinationNumerator.getValue() / destinationDenominator.getValue(),
        destinationNumerator.getUnits() + " / " + destinationDenominator.getUnits()
      );
    } else {
      return destinationNumerator;
    }
  }
  
  /**
   * Convert a number to kilograms.
   *
   * @param target The EngineNumber to convert.
   * @returns Target converted to kilograms.
   */
  _toKg(target) {
    const self = this;
    const asVolume = self._toVolume(target);
    const currentUnits = asVolume.getUnits();
    if (currentUnits === "mt") {
      return new EngineNumber(asVolume.getValue() * 1000, "kg");
    } else {
      return asVolume;
    }
  }
  
  /**
   * Convert a number to metric tons.
   *
   * @param target The EngineNumber to convert.
   * @returns Target converted to metric tons.
   */
  _toMt(target) {
    const self = this;
    const asVolume = self._toVolume(target);
    const currentUnits = asVolume.getUnits();
    if (currentUnits === "kg") {
      return new EngineNumber(asVolume.getValue() / 1000, "mt");
    } else {
      return asVolume;
    }
  }
  
  /**
   * Convert a number to a volume units.
   *
   * @param target The EngineNumber to convert.
   * @returns Target converted to kilograms or metric tons.
   */
  _toVolume(target) {
    const self = this;
    
    target = self._normalize(target);
    const currentUnits = target.getUnits();
    
    if (currentUnits === "mt" || currentUnits === "kg") {
      return target;
    } else if (currentUnits === "tCO2e") {
      const originalValue = target.getValue();
      const conversion = self._stateGetter.getSubstanceEmissions();
      const conversionValue = conversion.getValue();
      const newUnits = (conversion.getUnits().split(" / "))[1];
      const newValue = originalValue / conversionValue;
      return new EngineNumber(newValue, newUnits);
    } else if (currentUnits === "unit" || currentUnits === "units") {
      const originalValue = target.getValue();
      const conversion = self._stateGetter.getAmortizedUnitVolume();
      const conversionValue = conversion.getValue();
      const newUnits = (conversion.getUnits().split(" / "))[0];
      const newValue = originalValue * conversionValue;
      return new EngineNumber(newValue, newUnits);
    } else if (currentUnits === "%") {
      const originalValue = target.getValue();
      const asRatio = originalValue / 100;
      const total = self._stateGetter.getVolume();
      const newUnits = total.getUnits();
      const newValue = total.getValue() * asRatio;
      return new EngineNumber(newValue, newUnits);
    } else {
      throw "Unable to convert to volume: " + currentUnits;
    }
  }
  
  /**
   * Convert a number to units (population).
   *
   * @param target The EngineNumber to convert.
   * @returns Target converted to units (population).
   */
  _toUnits(target) {
    const self = this;
    
    target = self._normalize(target);
    const currentUnits = target.getUnits();
    
    if (currentUnits === "units") {
      return target;
    } else if (currentUnits === "unit") {
      return new EngineNumber(target.getValue(), "units");
    } else if (currentUnits === "kg" || currentUnits === "mt") {
      const conversion = self._stateGetter.getAmortizedUnitVolume();
      const conversionValue = conversion.getValue();
      const conversionUnitPieces = conversion.getUnits().split(" / ");
      const expectedUnits = conversionUnitPieces[0];
      const newUnits = conversionUnitPieces[1];
      const targetConverted = self.convert(target, expectedUnits);
      const originalValue = targetConverted.getValue();
      const newValue = originalValue / conversionValue;
      return new EngineNumber(newValue, "units");
    } else if (currentUnits === "tCO2e") {
      const originalValue = target.getValue();
      const conversion = self._stateGetter.getAmortizedUnitEmissions();
      const conversionValue = conversion.getValue();
      const newValue = originalValue / conversionValue;
      return new EngineNumber(newValue, "units");
    } else if (currentUnits === "%") {
      const originalValue = target.getValue();
      const asRatio = originalValue / 100;
      const total = self._stateGetter.getPopulation();
      const newValue = total.getValue() * asRatio;
      return new EngineNumber(newValue, "units");
    } else {
      throw "Unable to convert to pouplation: " + currentUnits;
    }
  }
  
  /**
   * Convert a number to emissions as tCO2e.
   *
   * @param target The EngineNumber to convert.
   * @returns Target converted to emissions as tCO2e.
   */
  _toEmissions(target) {
    const self = this;
    
    target = self._normalize(target);
    const currentUnits = target.getUnits();
    
    if (currentUnits === "tCO2e") {
      return target;
    } else if (currentUnits === "kg" || currentUnits === "mt") {
      const conversion = self._stateGetter.getSubstanceEmissions();
      const conversionValue = conversion.getValue();
      const conversionUnitPieces = conversion.getUnits().split(" / ");
      const newUnits = conversionUnitPieces[0];
      const expectedUnits = conversionUnitPieces[1];
      const targetConverted = self.convert(target, expectedUnits);
      const originalValue = targetConverted.getValue();
      const newValue = originalValue * conversionValue;
      return new EngineNumber(newValue, newUnits);
    } else if (currentUnits === "unit" || currentUnits === "units") {
      const originalValue = target.getValue();
      const conversion = self._stateGetter.getAmortizedUnitVolume();
      const conversionValue = conversion.getValue();
      const newValue = originalValue * conversionValue;
      return new EngineNumber(newValue, "tCO2e");
    } else if (currentUnits === "%") {
      const originalValue = target.getValue();
      const asRatio = originalValue / 100;
      const total = self._stateGetter.getEmissions();
      const newValue = total.getValue() * asRatio;
      return new EngineNumber(newValue, "tCO2e");
    } else {
      throw "Unable to convert to emissions: " + currentUnits;
    }
  }
  
  /**
   * Convert a number to years.
   *
   * @param target The EngineNumber to convert.
   * @returns Target converted to years.
   */
  _toYears(target) {
    const self = this;
    
    target = self._normalize(target);
    const currentUnits = target.getUnits();
    
    if (currentUnits === "years") {
      return target;
    } else if (currentUnits === "year") {
      return new EngineNumber(target.getValue(), "years");
    } else if (currentUnits === "tCO2e") {
      const perYearEmissionsValue = self._stateGetter.getEmissions().getValue();
      const newYears = target.getValue() / perYearEmissionsValue;
      return new EngineNumber(newYears, "years");
    } else if (currentUnits === "kg" || currentUnits === "mt") {
      const perYearVolume = self._stateGetter.getVolume();
      const perYearVolumeUnits = perYearVolume.getUnits();
      const perYearVolumeValue = perYearVolume.getValue();
      const volumeConverted = self.convert(target, perYearVolumeUnits);
      const volumeConvertedValue = volumeConverted.getValue();
      const newYears = volumeConvertedValue / perYearVolumeValue;
      return new EngineNumber(newYears, "years");
    } else if (currentUnits === "unit" || currentUnits === "units") {
      const perYearPopulation = self._stateGetter.getPopulationChange().getValue();
      const newYears = target.getValue() / perYearPopulation;
      return new EngineNumber(newYears, "years");
    } else if (currentUnits === "%") {
      const originalValue = target.getValue();
      const asRatio = originalValue / 100;
      const total = self._stateGetter.getYearsElapsed();
      const newValue = total.getValue() * asRatio;
      return new EngineNumber(newValue, "years");
    } else {
      throw "Unable to convert to years: " + currentUnits;
    }
  }
  
  /**
   * Normalize to non-ratio units if possible.
   *
   * @param target The number to convert from a units with ratio to single type units.
   * @returns Number after conversion to non-ratio units or target unchanged if it does not have a
   *    ratio units or could not be normalized.
   */
  _normalize(target) {
    const self = this;
    target = self._normUnits(target);
    target = self._normTime(target);
    target = self._normEmissions(target);
    target = self._normVolume(target);
    return target
  }
  
  /**
   * Convert a number where a units ratio has population in the denominator to a non-ratio units.
   *
   * @param target The value to normalize by population.
   * @returns Target without population in its units denominator.
   */
  _normUnits(target) {
    const self = this;
    const currentUnits = target.getUnits();

    const divUnit = currentUnits.endsWith("/ unit");
    const divUnits = currentUnits.endsWith("/ units");
    const isPerUnit = divUnit || divUnits;
    
    if (!isPerUnit) {
      return target;
    }
    
    const originalValue = target.getValue();
    const newUnits = (currentUnits.split(" / "))[0];
    const population = self._stateGetter.getPopulation();
    const populationValue = population.getValue();
    const newValue = originalValue * populationValue;
    
    return new EngineNumber(newValue, newUnits);
  }
  
  /**
   * Convert a number where a units ratio has time in the denominator to a non-ratio units.
   *
   * @param target The value to normalize by time.
   * @returns Target without time in its units denominator.
   */
  _normTime(target) {
    const self = this;
    const currentUnits = target.getUnits();
    
    if (!currentUnits.endsWith(" / year")) {
      return target;
    }
    
    const originalValue = target.getValue();
    const newUnits = (currentUnits.split(" / "))[0];
    const years = self._stateGetter.getYearsElapsed();
    const yearsValue = years.getValue();
    const newValue = originalValue * yearsValue;
    
    return new EngineNumber(newValue, newUnits);
  }
  
  /**
   * Convert a number where a units ratio has emissions in the denominator to a non-ratio units.
   *
   * @param target The value to normalize by emissions.
   * @returns Target without emissions in its units denominator.
   */
  _normEmissions(target) {
    const self = this;
    const currentUnits = target.getUnits();
    
    if (!currentUnits.endsWith(" / tCO2e")) {
      return target;
    }
    
    const originalValue = target.getValue();
    const newUnits = (currentUnits.split(" / "))[0];
    const totalEmissions = self._stateGetter.getEmissions();
    const totalEmissionsValue = totalEmissions.getValue();
    const newValue = originalValue * totalEmissionsValue;
    
    return new EngineNumber(newValue, newUnits);
  }
  
  /**
   * Convert a number where a units ratio has volume in the denominator to a non-ratio units.
   *
   * @param target The value to normalize by volume.
   * @returns Target without volume in its units denominator.
   */
  _normVolume(target) {
    const self = this;

    const targetUnits = target.getUnits();

    const divKg = targetUnits.endsWith(" / kg");
    const divMt = targetUnits.endsWith(" / mt");
    const needsNorm = divKg || divMt;
    if (!needsNorm) {
      return target;
    }
    
    const targetUnitPieces = targetUnits.split(" / ");
    const newUnits = targetUnitPieces[0];
    const expectedUnits = targetUnitPieces[1];
    
    const volume = self._stateGetter.getVolume();
    const volumeConverted = self.convert(volume, expectedUnits);
    const conversionValue = volumeConverted.getValue();
    
    const originalValue = target.getValue();
    const newValue = originalValue * conversionValue;
    
    return new EngineNumber(newValue, newUnits);
  }

}


class ConverterStateGetter {
  
  constructor(engine) {
    const self = this;
    self._engine = engine;
  }
  
  getSubstanceEmissions() {
    const self = this;
    throw "Not yet implemented.";
  }
  
  getAmortizedUnitVolume() {
    const self = this;
    throw "Not yet implemented";
  }
  
  getPopulation() {
    const self = this;
    throw "Not yet implemented";
  }
  
  getYearsElapsed() {
    const self = this;
    throw "Not yet implemented";
  }
  
  getEmissions() {
    const self = this;
    throw "Not yet implemented";
  }
  
  getVolume() {
    const self = this;
    throw "Not yet implemented";
  }
  
  getAmortizedUnitEmissions() {
    const self = this;
    throw "Not yet implemented";
  }
  
  getPopulationChange() {
    const self = this;
    throw "Not yet implemented";
  }
  
}


class OverridingConverterStateGetter {
  
  constructor(innerGetter) {
    const self = this;
    self._innerGetter = innerGetter;
    self._substanceEmissions = null;
    self._amortizedUnitVolume = null;
    self._population = null;
    self._yearsElapsed = null;
    self._totalEmissions = null;
    self._volume = null;
    self._amortizedUnitEmissions = null;
    self._populationChange = null;
  }
  
  setSubstanceEmissions(newValue) {
    const self = this;
    self._substanceEmissions = newValue;
  }
  
  getSubstanceEmissions() {
    const self = this;
    if (self._substanceEmissions === null) {
      return self._innerGetter.getSubstanceEmissions();
    } else {
      return self._substanceEmissions;
    }
  }
  
  setAmortizedUnitVolume(newValue) {
    const self = this;
    self._amortizedUnitVolume = newValue;
  }
  
  getAmortizedUnitVolume() {
    const self = this;
    if (self._amortizedUnitVolume === null) {
      return self._innerGetter.getAmortizedUnitVolume();
    } else {
      return self._amortizedUnitVolume;
    }
  }
  
  setPopulation(newValue) {
    const self = this;
    self._population = newValue;
  }
  
  getPopulation() {
    const self = this;
    if (self._population === null) {
      return self._innerGetter.getPopulation();
    } else {
      return self._population;
    }
  }
  
  setYearsElapsed(newValue) {
    const self = this;
    self._yearsElapsed = newValue;
  }
  
  getYearsElapsed() {
    const self = this;
    if (self._yearsElapsed === null) {
      return self._innerGetter.getYearsElapsed();
    } else {
      return self._yearsElapsed;
    }
  }
  
  setEmissions(newValue) {
    const self = this;
    self._totalEmissions = newValue;
  }
  
  getEmissions() {
    const self = this;
    if (self._totalEmissions === null) {
      return self._innerGetter.getEmissions();
    } else {
      return self._totalEmissions;
    }
  }
  
  setVolume(newValue) {
    const self = this;
    self._volume = newValue;
  }
  
  getVolume() {
    const self = this;
    if (self._volume === null) {
      return self._innerGetter.getVolume();
    } else {
      return self._volume;
    }
  }
  
  setAmortizedUnitEmissions(newValue) {
    const self = this;
    self._amortizedUnitEmissions = newValue;
  }
  
  getAmortizedUnitEmissions() {
    const self = this;
    if (self._amortizedUnitEmissions === null) {
      return self._innerGetter.getAmortizedUnitEmissions();
    } else {
      return self._amortizedUnitEmissions;
    }
  }
  
  setPopulationChange(newValue) {
    const self = this;
    self._populationChange = newValue;
  }
  
  getPopulationChange() {
    const self = this;
    if (self._populationChange === null) {
      return self._innerGetter.getPopulationChange();
    } else {
      return self._populationChange;
    }
  }
  
}


class StreamParameterization {
  
  constructor() {
    const self = this;
    const createZero = (x) => new EngineNumber(0, x);
    self._ghgIntensity = createZero("tCO2e / kg");
    self._initialCharge = createZero("kg / unit");
    self._rechargePopulation = createZero("%");
    self._rechargeIntensity = createZero("kg / unit");
    self._recoveryRate = createZero("%");
    self._yieldRate = createZero("%");
    self._retirementRate = createZero("%");
  }
  
  setGhgIntensity(newValue) {
    const self = this;
    self._ghgIntensity = newValue;
  }
  
  getGhgIntensity() {
    const self = this;
    return self._ghgIntensity;
  }
  
  setInitialCharge(newValue) {
    const self = this;
    self._initialCharge = newValue;
  }
  
  getInitialCharge() {
    const self = this;
    return self._initialCharge;
  }
  
  setRechargePopulation(newValue) {
    const self = this;
    self._rechargePopulation = newValue;
  }
  
  getRechargePopulation() {
    const self = this;
    return self._rechargePopulation;
  }
  
  setRechargeIntensity(newValue) {
    const self = this;
    self._rechargeIntensity = newValue;
  }
  
  getRechargeIntensity() {
    const self = this;
    return self._rechargeIntensity;
  }
  
  setRecoveryRate(newValue) {
    const self = this;
    self._recoveryRate = newValue;
  }
  
  getRecoveryRate() {
    const self = this;
    return self._recoveryRate;
  }
  
  setYieldRate(newValue) {
    const self = this;
    self._yieldRate = newValue;
  }
  
  getYieldRate() {
    const self = this;
    return self._yieldRate;
  }
  
  setRetirementRate(newValue) {
    const self = this;
    self._retirementRate = newValue;
  }
  
  getRetirementRate() {
    const self = this;
    return self._retirementRate;
  }
  
}


class StreamKeeper {
  
  constructor(unitConverter) {
    const self = this;
    self._substances = new Map();
    self._streams = new Map();
    self._unitConverter = unitConverter;
  }
  
  hasSubstance(application, substance) {
    const self = this;
    const key = self._getKey(application, substance);
    return self._substances.has(key);
  }
  
  ensureSubstance(application, substance) {
    const self = this;
    
    if (self.hasSubstance(application, substance)) {
      return;
    }
    
    const key = self._getKey(application, substance);
    self._substances.set(key, new StreamParameterization());
    
    const makeZero = (units) => new EngineNumber(0, units);

    // Sales: manufacture, import
    self._streams.set(self._getKey(application, substance, "manufacture"), makeZero("kg"));
    self._streams.set(self._getKey(application, substance, "import"), makeZero("kg"));

    // Emissions: count, conversion
    self._streams.set(self._getKey(application, substance, "emissions"), makeZero("tCO2e"));
    
    // Population
    self._streams.set(self._getKey(application, substance, "equipment"), makeZero("units"));
    self._streams.set(self._getKey(application, substance, "priorEquipment"), makeZero("units"));
  }
  
  setStream(application, substance, name, value) {
    const self = this;
    self._ensureSubstancePresent(application, substance);
    self._ensureStreamKnown(name);
    
    if (name === "sales") {
      const manufactureValueRaw = self.getStream(application, substance, "manufacture");
      const importValueRaw = self.getStream(application, substance, "import");
      const manufactureValue = self._unitConverter.convert(manufactureValueRaw, "kg");
      const importValue = self._unitConverter.convert(importValueRaw, "kg");
      const manufactureAmount = manufactureValue.getValue();
      const importAmount = importValue.getValue();
      
      const totalAmount = manufactureAmount + importAmount;
      const isZero = totalAmount == 0;
      const manufacturePercent = isZero ? 0.5 : (manufactureAmount / totalAmount);
      const importPercent = isZero ? 0.5 : (importAmount / totalAmount);
      
      const manufactureShare = value.getValue() * manufacturePercent;
      const importShare = value.getValue() * importPercent;
      const manufactureNewValue = new EngineNumber(manufactureShare, value.getUnits());
      const importNewValue = new EngineNumber(importShare, value.getUnits());
      
      self.setStream(application, substance, "manufacture", manufactureNewValue);
      self.setStream(application, substance, "import", importNewValue);
      return;
    }
    
    const unitsNeeded = self._getUnits(name);
    const valueConverted = self._unitConverter.convert(value, unitsNeeded);
    self._streams.set(self._getKey(application, substance, name), valueConverted);
  }
  
  getStream(application, substance, name) {
    const self = this;
    self._ensureSubstancePresent(application, substance);
    self._ensureStreamKnown(name);
    
    if (name === "sales") {
      const manufactureAmountRaw = self.getStream(application, substance, "manufacture");
      const importAmountRaw = self.getStream(application, substance, "import");
      const manufactureAmount = self._unitConverter.convert(manufactureAmountRaw, "kg");
      const importAmount = self._unitConverter.convert(importAmountRaw, "kg");
      const manufactureAmountValue = manufactureAmount.getValue();
      const importAmountValue = importAmount.getValue();
      const newTotal = manufactureAmountValue + importAmountValue;
      return new EngineNumber(newTotal, "kg");
    } else {
      return self._streams.get(self._getKey(application, substance, name));
    }
  }
  
  isKnownStream(application, substance, name) {
    const self = this;
    return self._streams.has(self._getKey(application, substance, name));
  }
  
  copyToPriorEquipment() {
    const self = this;
    const allKeys = Array.from(self._substances.keys());
    allKeys.forEach((key) => {
      const equipment = self._streams.get(key + "\t" + "equipment");
      self._streams.set(key + "\t" + "priorEqipment", equipment);
    });
  }
  
  setGhgIntensity(application, substance, newValue) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    parameterization.setGhgIntensity(newValue);
  }
  
  getGhgIntensity(application, substance) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    return parameterization.getGhgIntensity();
  }
  
  setInitialCharge(application, substance, newValue) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    parameterization.setInitialCharge(newValue);
  }
  
  getInitialCharge(application, substance) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    return parameterization.getInitialCharge();
  }
  
  setRechargePopulation(application, substance, newValue) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    parameterization.setRechargePopulation(newValue);
  }
  
  getRechargePopulation(application, substance) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    return parameterization.getRechargePopulation();
  }
  
  setRechargeIntensity(application, substance, newValue) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    parameterization.setRechargeIntensity(newValue);
  }
  
  getRechargeIntensity(application, substance) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    return parameterization.getRechargeIntensity();
  }
  
  setRecoveryRate(application, substance, newValue) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    parameterization.setRecoveryRate(newValue);
  }
  
  getRecoveryRate(application, substance) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    return parameterization.getRecoveryRate();
  }
  
  setYieldRate(application, substance, newValue) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    parameterization.setYieldRate(newValue);
  }
  
  getYieldRate(application, substance) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    return parameterization.getYieldRate();
  }
  
  setRetirementRate(application, substance, newValue) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    parameterization.setRetirementRate(newValue);
  }
  
  getRetirementRate(application, substance) {
    const self = this;
    const parameterization = self._getParameterization(application, substance);
    return parameterization.getRetirementRate();
  }
  
  _getParameterization(application, substance) {
    const self = this;
    self._ensureSubstancePresent(application, substance);
    const key = self._getKey(application, substance);
    return self._substances.get(key);
  }
  
  _getKey(application, substance, name, substream) {
    const self = this;
    const pieces = [application, substance, name, substream];
    const getIsNotGiven = (x) => x === null || x === undefined;
    const piecesSafe = pieces.map((x) => getIsNotGiven(x) ? "-" : x + "");
    return piecesSafe.join("\t");
  }
  
  _ensureSubstancePresent(application, substance) {
    const self = this;
    
    if (!self.hasSubstance(application, substance)) {
      const pairStr = application + ", " + substance;
      throw "Not a known application substance pair: " + pairStr;
    }
  }
  
  _ensureStreamKnown(name) {
    const self = this;
    if (!STREAM_BASE_UNITS.has(name)) {
      throw "Unknown stream: " + name;
    }
  }
  
  _getUnits(name) {
    const self = this;
    self._ensureStreamKnown(name);
    return STREAM_BASE_UNITS.get(name);
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
    self._streamKeeper.ensureSubstance(self._scope.getApplication(), newSubstance);
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
    const retirementRaw = self._streamKeeper.getRetirementRate(application, substance);
    const retiredPopulation = unitConverter.convert(retirementRaw, "units");
    
    // Get substance sales
    const substanceSalesRaw = self.getStream("sales");
    const substanceSales = self._unitConverter.convert(substanceSalesRaw, "kg");
    
    // Get recycling population
    const recoveryVolumeRaw = self._streamKeeper.getRecoveryRate(application, substance);
    const recoveryVolume = self._unitConverter.convert(recoveryVolumeRaw, "kg");
    
    // Get recycling amount
    stateGetter.setVolume(recoveryVolume);
    const recycledVolumeRaw = self._streamKeeper.getYieldRate(application, substance);
    const recycledVolume = unitConverter.convert(recoveryRaw, "kg");
    stateGetter.setVolume(null);
    
    // Get recharge population
    const rechargePopRaw = self._streamKeeper.getRechargePopulation(application, substance);
    const rechargePop = unitConverter.convert(rechargePopRaw, "units");
    
    // Get recharge amount
    stateGetter.setPopulation(rechargePop);
    const rechargeIntensityRaw = self._streamKeeper.getRechargeIntensity(application, substance);
    const rechargeVolume = unitConverter.convert(rechargeIntensityRaw, "kg");
    stateGetter.setPopulation(priorPopulation);
    
    // Get total volume available for new units
    const salesKg = substanceSales.getVolume();
    const recycledKg = recycledVolume.getVolume();
    const rechargeKg = rechargeVolume.getVolume();
    const availableForNewUnitsKg = salesKg + recycledKg - rechargeKg;
    
    // Convert to unit delta
    const initialChargeRaw = self._streamKeeper.getInitialCharge(application, substance);
    const initialCharge = unitConverter.convert(initialChargeRaw, "kg / unit");
    const initialChargeKgUnit = initialCharge.getValue()
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

export { EngineNumber, YearMatcher, Scope, UnitConverter, Engine };
