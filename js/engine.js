const GLOBAL_CONTEXT = 0;
const STANZA_CONTEXT = 1;
const APPLICATION_CONTEXT = 2;
const SUBSTANCE_CONTEXT = 3;


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
        .reduce((a, b) => a + b);
      
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


class UnitConverter {
  
  constructor(stateGetter) {
    const self = this;
    self._stateGetter = stateGetter;
  }
  
  convert(source, destinationUnits) {
    const self = this;
    const strategy = {
      "kg": (x) => self._toKg(x),
      "mt": (x) => self._toMt(x),
      "unit": (x) => self._toUnits(x),
      "units": (x) => self._toUnits(x),
      "tCO2e": (x) => self._toEmissions(x),
      "year": (x) => self._toYears(x),
      "years": (x) => self._toYears(x),
    }[destinationUnits];
    return strategy(source);
  }
  
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
  
  _normalize(target) {
    const self = this;
    target = self._normUnits(target);
    target = self._normTime(target);
    target = self._normEmissions(target);
    target = self._normVolume(target);
    return target
  }
  
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


class Engine {
  
  constructor(startYear, endYear) {
    const self = this;
    self._startYear = startYear;
    self._endYear = endYear;
  }
  
  
  
}

export { EngineNumber, YearMatcher, Scope, UnitConverter, Engine };
