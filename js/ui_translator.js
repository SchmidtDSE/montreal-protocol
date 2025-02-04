/**
 * Logic to interpret and translate plastics language scripts.
 * Provides classes and utilities for converting between text-based scripts
 * and object representations.
 * 
 * @module ui_translator
 * @license BSD, see LICENSE.md
 */

import {EngineNumber} from "engine_number";
import {YearMatcher} from "engine_state";

/**
 * Command compatibility mapping to compatibility modes:
 * 
 * - "any": Compatible with both policy and definition contexts
 * - "none": Not compatible with simplified UI
 * - "definition": Only compatible with substance definitions.
 * - "policy": Only compatible with policy modifications.
 * 
 * @type {Object.<string, string>}
 */

const COMMAND_COMPATIBILITIES = {
  "change": "any",
  "define var": "none",
  "retire": "any",
  "setVal": "any",
  "cap": "any",
  "floor": "any",
  "limit": "any",
  "initial charge": "definition",
  "equals": "definition",
  "recharge": "definition",
  "recycle": "policy",
  "replace": "policy",
};

const toolkit = QubecTalk.getToolkit();

/**
 * Indents a single piece of text by the specified number of spaces.
 *
 * @param {string} piece - The text to indent
 * @param {number} [spaces=0] - Number of spaces to indent
 * @returns {string} The indented text
 * @private
 */
function indentSingle(piece, spaces) {
  if (spaces === undefined) {
    spaces = 0;
  }

  let prefix = "";
  for (let i = 0; i < spaces; i++) {
    prefix += " ";
  }

  return prefix + piece;
}

/**
 * Indents an array of text pieces by the specified number of spaces.
 *
 * @param {string[]} pieces - Array of text pieces to indent
 * @param {number} spaces - Number of spaces to indent each piece
 * @returns {string[]} Array of indented text pieces
 */
function indent(pieces, spaces) {
  return pieces.map((piece) => indentSingle(piece, spaces));
}

/**
 * Creates a function that adds indented code pieces to a target array.
 *
 * @param {string[]} target - Target array to add code pieces to
 * @returns {Function} Function that takes a code piece and spaces count
 */
function buildAddCode(target) {
  return (x, spaces) => {
    target.push(indentSingle(x, spaces));
  };
}

/**
 * Joins code pieces into a single string with newlines.
 *
 * @param {string[]} target - Array of code pieces to join
 * @returns {string} Combined code string
 */
function finalizeCodePieces(target) {
  return target.join("\n");
}

/**
 * Represents a complete program containing applications, policies, and scenarios.
 */
class Program {
  /**
   * Creates a new Program.
   *
   * @param {Application[]} applications - Array of application definitions.
   * @param {DefinitionalStanza[]} policies - Array of policy definitions.
   * @param {SimulationScenario[]} scenarios - Array of simulation scenarios.
   * @param {boolean} isCompatible - Whether program is compatible with UI editing.
   */
  constructor(applications, policies, scenarios, isCompatible) {
    const self = this;
    self._applications = applications;
    self._policies = policies;
    self._scenarios = scenarios;
    self._isCompatible = isCompatible && self._passesTempCompatiblityTests();
  }

  /**
   * Gets all substances across all applications.
   *
   * @returns {Substance[]} Array of all substances.
   */
  getSubstances() {
    const self = this;
    return self
      .getApplications()
      .map((x) => x.getSubstances())
      .flat();
  }

  /**
   * Inserts or updates a substance in an application.
   *
   * @param {string} priorApplication - Name of application to insert into.
   * @param {string} priorSubstanceName - Name of substance to replace, or null for new.
   * @param {Substance} substance - The substance to insert.
   */
  insertSubstance(priorApplication, priorSubstanceName, substance) {
    const self = this;
    const application = self.getApplication(priorApplication);
    application.insertSubstance(priorSubstanceName, substance);
  }

  /**
   * Deletes a substance from an application.
   *
   * @param {string} applicationName - Name of application containing substance.
   * @param {string} substanceName - Name of substance to delete.
   */
  deleteSubstance(applicationName, substanceName) {
    const self = this;
    const application = self.getApplication(applicationName);
    application.deleteSubstance(substanceName);
    self._policies = self._policies.filter((x) => {
      const application = x.getApplications()[0];
      const substance = application.getSubstances()[0];
      const candidateName = substance.getName();
      return candidateName !== substanceName;
    });
    self._removeUnknownPoliciesFromScenarios();
  }

  /**
   * Gets all applications.
   *
   * @returns {Application[]} Array of applications.
   */
  getApplications() {
    const self = this;
    return self._applications;
  }

  /**
   * Gets an application by name.
   *
   * @param {string} name - Name of application to find.
   * @returns {Application|null} The application or null if not found.
   */
  getApplication(name) {
    const self = this;
    const matching = self._applications.filter((x) => x.getName() === name);
    return matching.length == 0 ? null : matching[0];
  }

  /**
   * Adds a new application.
   *
   * @param {Application} newApplication - Application to add.
   */
  addApplication(newApplication) {
    const self = this;
    self._applications.push(newApplication);
  }

  /**
   * Deletes an application by name.
   *
   * @param {string} name - Name of application to delete.
   */
  deleteApplication(name) {
    const self = this;
    self._applications = self._applications.filter((x) => x.getName() !== name);
    self._policies = self._policies.filter((x) => x.getApplications()[0].getName() !== name);
    self._removeUnknownPoliciesFromScenarios();
  }

  /**
   * Renames an application.
   *
   * @param {string} oldName - Current name of application.
   * @param {string} newName - New name for application.
   */
  renameApplication(oldName, newName) {
    const self = this;
    const priorApplications = self._applications.filter((x) => x.getName() === oldName);
    priorApplications.forEach((x) => x.rename(newName));
  }

  /**
   * Gets all policies.
   *
   * @returns {DefinitionalStanza[]} Array of policies.
   */
  getPolicies() {
    const self = this;
    return self._policies;
  }

  /**
   * Gets a policy by name.
   *
   * @param {string} name - Name of policy to find.
   * @returns {DefinitionalStanza|null} The policy or null if not found.
   */
  getPolicy(name) {
    const self = this;
    const matching = self._policies.filter((x) => x.getName() === name);
    return matching.length == 0 ? null : matching[0];
  }

  /**
   * Deletes a policy by name.
   *
   * @param {string} name - Name of policy to delete.
   * @param {boolean} [filterUnknown=true] - Whether to filter unknown policies.
   */
  deletePolicy(name, filterUnknown) {
    const self = this;

    if (filterUnknown === undefined) {
      filterUnknown = true;
    }

    self._policies = self._policies.filter((x) => x.getName() !== name);

    if (filterUnknown) {
      self._removeUnknownPoliciesFromScenarios();
    }
  }

  /**
   * Inserts or updates a policy.
   *
   * @param {string} oldName - Name of policy to replace, or null for new.
   * @param {DefinitionalStanza} newPolicy - Policy to insert.
   */
  insertPolicy(oldName, newPolicy) {
    const self = this;
    const nameChange = oldName !== newPolicy.getName();
    self.deletePolicy(oldName, nameChange);
    self._policies.push(newPolicy);
  }

  /**
   * Gets all simulation scenarios.
   *
   * @returns {SimulationScenario[]} Array of scenarios.
   */
  getScenarios() {
    const self = this;
    return self._scenarios;
  }

  /**
   * Gets a simulation scenario by name.
   *
   * @param {string} name - Name of scenario to find.
   * @returns {SimulationScenario|null} The scenario or null if not found.
   */
  getScenario(name) {
    const self = this;
    const matching = self._scenarios.filter((x) => x.getName() === name);
    return matching.length == 0 ? null : matching[0];
  }

  /**
   * Deletes a simulation scenario by name.
   *
   * @param {string} name - Name of scenario to delete.
   */
  deleteScenario(name) {
    const self = this;
    self._scenarios = self._scenarios.filter((x) => x.getName() !== name);
  }

  /**
   * Inserts or updates a simulation scenario.
   *
   * @param {string} oldName - Name of scenario to replace, or null for new.
   * @param {SimulationScenario} scenario - Scenario to insert.
   */
  insertScenario(oldName, scenario) {
    const self = this;
    self.deleteScenario(oldName);
    self._scenarios.push(scenario);
  }

  /**
   * Gets whether program is compatible with UI editing.
   *
   * @returns {boolean} True if compatible, false otherwise.
   */
  getIsCompatible() {
    const self = this;
    return self._isCompatible;
  }

  /**
   * Generates the code representation of the program with the specified indentation.
   *
   * @param {number} spaces - Number of spaces to use for indenting the generated code.
   * @returns {string} The code representation of the program with specified indentation.
   */
  toCode(spaces) {
    const self = this;

    const baselinePieces = [];
    const addCode = buildAddCode(baselinePieces);

    if (self.getApplications().length > 0) {
      const applicationsCode = self
        .getApplications()
        .map((x) => x.toCode(spaces + 2))
        .join("\n\n\n");

      addCode("start default", spaces);
      addCode("", spaces);
      addCode(applicationsCode, 0);
      addCode("", spaces);
      addCode("end default", spaces);
      addCode("", spaces);
      addCode("", spaces);
    }

    if (self.getPolicies().length > 0) {
      const policiesCode = self
        .getPolicies()
        .map((x) => x.toCode(spaces))
        .join("\n\n\n\n");
      addCode(policiesCode, spaces);
      addCode("", spaces);
      addCode("", spaces);
    }

    if (self.getScenarios().length > 0) {
      addCode("start simulations", spaces);
      addCode("", spaces);
      const scenariosCode = self
        .getScenarios()
        .map((x) => x.toCode(2))
        .join("\n\n\n");
      addCode(scenariosCode, spaces);
      addCode("", spaces);
      addCode("end simulations", spaces);
    }

    return finalizeCodePieces(baselinePieces);
  }

  /**
   * Updates the scenarios by removing policies that are not known.
   * 
   * This method filters each scenario to include only the policies 
   * that are in the known policies list. It subsequently updates each 
   * scenario with the filtered list of policies.
   * 
   * @private
   */
  _removeUnknownPoliciesFromScenarios() {
    const self = this;
    const knownPolicies = new Set(self._policies.map((x) => x.getName()));
    self._scenarios = self._scenarios.map((scenario) => {
      if (!scenario.getIsCompatible()) {
        return scenario;
      }

      const name = scenario.getName();
      const start = scenario.getYearStart();
      const end = scenario.getYearEnd();

      const selectedPolicies = scenario.getPolicyNames();
      const allowedPolicies = selectedPolicies.filter((x) => knownPolicies.has(x));

      return new SimulationScenario(name, allowedPolicies, start, end, true);
    });
  }

  /**
   * Determines if the temporary compatibility tests are passed.
   *
   * This private method evaluates the compatibility of applications 
   * and policies with specific conditions that must be satisfied 
   * to pass the temporary compatibility tests.
   *
   * @private
   * @returns {boolean} True if all temporary compatibility tests are passed, false otherwise.
   */
  _passesTempCompatiblityTests() {
    const self = this;

    const problematicApplications = self._applications.filter((application) => {
      const substances = application.getSubstances();
      const problematicSubstances = substances.filter((substance) => {
        const durationIsFullSpan = (duration) => {
          if (duration === null) {
            return true;
          }
          const durationFullSpan = duration.getStart() === null && duration.getEnd() === null;
          return durationFullSpan;
        };

        const getInitialChargeProblematic = () => {
          const initialCharges = substance.getInitialCharges();
          const uniqueTargets = new Set(initialCharges.map((x) => x.getTarget()));
          if (uniqueTargets.size != initialCharges.length) {
            return true;
          }
          const initialChargesWithDuration = initialCharges.filter((initialCharge) => {
            const duration = initialCharge.getDuration();
            return !durationIsFullSpan(duration);
          });
          if (initialChargesWithDuration.length > 0) {
            return true;
          }
        };

        const getEqualsProblematic = () => {
          const equals = substance.getEquals();
          if (equals === null) {
            return false;
          } else {
            const duration = equals.getDuration();
            return !durationIsFullSpan(duration);
          }
        };

        return getInitialChargeProblematic() || getEqualsProblematic();
      });
      return problematicSubstances.length > 0;
    });

    const applicationsOk = problematicApplications.length == 0;

    const problematicPolicies = self._policies.filter((policy) => {
      const applications = policy.getApplications();
      if (applications.length != 1) {
        return true;
      }

      const application = applications[0];
      const substances = application.getSubstances();
      if (substances.length != 1) {
        return true;
      }

      return false;
    });

    const policiesOk = problematicPolicies.length == 0;

    return applicationsOk && policiesOk;
  }
}

/**
 * Represents an "about" stanza in the QubecTalk script.
 */
class AboutStanza {
  /**
   * Gets the name of this stanza.
   * @returns {string} The stanza name "about".
   */
  getName() {
    const self = this;
    return "about";
  }

  /**
   * Generates the code representation of the "about" stanza.
   *
   * @param {number} spaces - Number of spaces for indentation.
   * @returns {string} Code representation of the stanza.
   */
  toCode(spaces) {
    const self = this;

    const baselinePieces = [];
    const addCode = buildAddCode(baselinePieces);

    addCode("start about", spaces);
    addCode("end about", spaces);

    return finalizeCodePieces(baselinePieces);
  }

  /**
   * Checks compatibility of the "about" stanza with UI editing.
   *
   * @returns {boolean} False, as "about" stanza is not compatible with UI.
   */
  getIsCompatible() {
    const self = this;
    return false;
  }
}

/**
 * Represents a definitional stanza that can contain applications and policies.
 */
class DefinitionalStanza {
  /**
   * Creates a new DefinitionalStanza.
   * @param {string} name - Name of the stanza.
   * @param {Application[]} applications - Array of applications.
   * @param {boolean} isCompatible - Whether stanza is UI-compatible.
   */
  constructor(name, applications, isCompatible) {
    const self = this;
    self._name = name;
    self._applications = applications;
    self._isCompatible = isCompatible;
  }

  /**
   * Gets the name of this definitional stanza.
   *
   * @returns {string} The name of the stanza ("default" or policy name).
   */
  getName() {
    const self = this;
    return self._name; 
  }

  /**
   * Gets the applications defined in this stanza.
   *
   * @returns {Application[]} Array of applications defined in the stanza.
   */
  getApplications() {
    const self = this;
    return self._applications;
  }

  /**
   * Checks if this stanza is compatible with UI editing.
   *
   * @returns {boolean} True if stanza can be edited in UI, false otherwise.
   */
  getIsCompatible() {
    const self = this;
    return self._isCompatible;
  }

  /**
   * Generates the code representation of this stanza.
   * 
   * Generates the QubecTalk code representation of this definitional stanza,
   * including all its applications and appropriate indentation.
   *
   * @param {number} spaces - Number of spaces to use for indentation.
   * @returns {string} The code representation of the stanza.
   */
  toCode(spaces) {
    const self = this;

    const baselinePieces = [];
    const addCode = buildAddCode(baselinePieces);
    const isDefault = self.getName() === "default";

    addCode("start " + (isDefault ? "default" : 'policy "' + self.getName() + '"'), spaces);
    addCode("", spaces);

    if (self.getApplications().length > 0) {
      const applicationsCode = self
        .getApplications()
        .map((x) => x.toCode(spaces + 2))
        .join("\n\n\n");
      addCode(applicationsCode, 0);
    }

    addCode("", spaces);
    addCode("end " + (isDefault ? "default" : "policy"), spaces);

    return finalizeCodePieces(baselinePieces);
  }
}

/**
 * Represents a simulation scenario that applies policies over a time period.
 */
class SimulationScenario {
  /**
   * Creates a new SimulationScenario.
   * @param {string} name - Name of the scenario.
   * @param {string[]} policyNames - Array of policy names to apply.
   * @param {number} yearStart - Start year of simulation.
   * @param {number} yearEnd - End year of simulation.
   * @param {boolean} isCompatible - Whether scenario is UI-compatible.
   */
  constructor(name, policyNames, yearStart, yearEnd, isCompatible) {
    const self = this;
    self._name = name;
    self._policyNames = policyNames;
    self._yearStart = yearStart;
    self._yearEnd = yearEnd;
    self._isCompatible = isCompatible;
  }

  /**
   * Gets the name of this simulation scenario.
   *
   * @returns {string} The scenario name.
   */
  getName() {
    const self = this;
    return self._name;
  }

  /**
   * Gets names of policies included in this scenario.
   *
   * @returns {string[]} Array of policy names to apply.
   */
  getPolicyNames() {
    const self = this;
    return self._policyNames;
  }

  /**
   * Gets the start year of the simulation.
   *
   * @returns {number} The year the simulation starts.
   */
  getYearStart() {
    const self = this;
    return self._yearStart;
  }

  /**
   * Gets the end year of the simulation.
   *
   * @returns {number} The year the simulation ends.
   */
  getYearEnd() {
    const self = this;
    return self._yearEnd;
  }

  /**
   * Checks if this scenario is compatible with UI editing.
   *
   * @returns {boolean} True if scenario can be edited in UI, false otherwise.
   */
  getIsCompatible() {
    const self = this;
    return self._isCompatible;
  }

  /**
   * Generates the code representation of this scenario.
   *
   * @param {number} spaces - Number of spaces to use for indentation.
   * @returns {string} The code representation of the simulation scenario.
   */
  toCode(spaces) {
    const self = this;

    const baselinePieces = [];
    const addCode = buildAddCode(baselinePieces);

    addCode('simulate "' + self.getName() + '"', spaces);

    if (self.getPolicyNames().length > 0) {
      self.getPolicyNames().forEach((x, i) => {
        const prefix = i == 0 ? "using" : "then";
        addCode(prefix + ' "' + x + '"', spaces + 2);
      });
    }

    addCode("from years " + self.getYearStart() + " to " + self.getYearEnd(), spaces);
    return finalizeCodePieces(baselinePieces);
  }
}

/**
 * Represents a simulations stanza that contains multiple simulation scenarios.
 */
class SimulationStanza {
  /**
   * Creates a new SimulationStanza.
   * 
   * @param {SimulationScenario[]} scenarios - Array of simulation scenarios.
   * @param {boolean} isCompatible - Whether stanza is compatible with UI editing.
   */
  constructor(scenarios, isCompatible) {
    const self = this;
    self._scenarios = scenarios;
    self._isCompatible = isCompatible;
  }

  /**
   * Checks if this stanza is compatible with UI editing.
   *
   * @returns {boolean} True if stanza can be edited in UI, false otherwise.
   */
  getIsCompatible() {
    const self = this;
    return self._isCompatible;
  }

  /**
   * Gets the simulation scenarios in this stanza.
   *
   * @returns {SimulationScenario[]} Array of simulation scenarios.
   */
  getScenarios() {
    const self = this;
    return self._scenarios;
  }

  /**
   * Gets the name of this stanza.
   *
   * @returns {string} The string "simulations".
   */
  getName() {
    const self = this;
    return "simulations";
  }

  /**
   * Generates the code representation of this stanza.
   * 
   * Generates the QubecTalk code representation of this simulations stanza,
   * including all its scenarios and appropriate indentation.
   *
   * @param {number} spaces - Number of spaces to use for indentation.
   * @returns {string} The code representation of the stanza.
   */
  toCode(spaces) {
    const self = this;

    const baselinePieces = [];
    const addCode = buildAddCode(baselinePieces);

    addCode("start simulations", spaces);

    if (self.getScenarios().length > 0) {
      addCode("", spaces);
      const scenariosCode = self
        .getScenarios()
        .map((x) => x.toCode(2))
        .join("\n\n\n");
      addCode(scenariosCode, spaces);
      addCode("", spaces);
    }

    addCode("end simulations", spaces);
    return finalizeCodePieces(baselinePieces);
  }
}

/**
 * Represents an application that contains substances and their properties.
 */
class Application {
  /**
   * Creates a new Application.
   * @param {string} name - Name of the application.
   * @param {Substance[]} substances - Array of substances.
   * @param {boolean} isModification - Whether this modifies existing application.
   * @param {boolean} isCompatible - Whether application is UI-compatible.
   */
  constructor(name, substances, isModification, isCompatible) {
    const self = this;
    self._name = name;
    self._substances = substances;
    self._isModification = isModification;
    self._isCompatible = isCompatible;
  }

  /**
   * Gets the name of this application.
   * 
   * @returns {string} The application name.
   */
  getName() {
    const self = this;
    return self._name;
  }

  /**
   * Renames this application.
   * 
   * @param {string} newName - The new name for the application.
   */
  rename(newName) {
    const self = this;
    self._name = newName;
  }

  /**
   * Gets all substances defined in this application.
   * 
   * @returns {Substance[]} Array of substances.
   */
  getSubstances() {
    const self = this;
    return self._substances;
  }

  /**
   * Inserts or updates a substance in this application.
   * 
   * @param {string} substanceName - Name of substance to replace, or null for new.
   * @param {Substance} newVersion - The substance to insert.
   */
  insertSubstance(substanceName, newVersion) {
    const self = this;
    self.deleteSubstance(substanceName);
    self._substances.push(newVersion);
  }

  /**
   * Deletes a substance from this application.
   * 
   * @param {string} substanceName - Name of substance to delete.
   */
  deleteSubstance(substanceName) {
    const self = this;
    self._substances = self._substances.filter((x) => x.getName() !== substanceName);
  }

  /**
   * Gets a specific substance by name.
   * 
   * @param {string} name - Name of substance to find.
   * @returns {Substance|null} The substance or null if not found.
   */
  getSubstance(name) {
    const self = this;
    const matching = self._substances.filter((x) => x.getName() === name);
    return matching.length == 0 ? null : matching[0];
  }

  /**
   * Checks if this application modifies an existing one.
   * 
   * @returns {boolean} True if this modifies an existing application.
   */
  getIsModification() {
    const self = this;
    return self._isModification;
  }

  /**
   * Checks if this application is compatible with UI editing.
   * 
   * @returns {boolean} True if application can be edited in UI.
   */
  getIsCompatible() {
    const self = this;
    return self._isCompatible;
  }

  /**
   * Generates the code representation of this application.
   * 
   * @param {number} spaces - Number of spaces to use for indentation.
   * @returns {string} The code representation of the application.
   */
  toCode(spaces) {
    const self = this;

    const baselinePieces = [];
    const addCode = buildAddCode(baselinePieces);

    const prefix = self.getIsModification() ? "modify" : "define";
    addCode(prefix + ' application "' + self.getName() + '"', spaces);

    if (self.getSubstances().length > 0) {
      addCode("", spaces);
      const substancesCode = self
        .getSubstances()
        .map((x) => x.toCode(spaces + 2))
        .join("\n\n\n");
      addCode(substancesCode, 0);
      addCode("", spaces);
    }

    addCode("end application", spaces);
    return finalizeCodePieces(baselinePieces);
  }
}

/**
 * Builds substances with their properties and commands.
 * Provides a fluent interface for constructing Substance objects
 * with various commands and properties.
 */
class SubstanceBuilder {
  /**
   * Creates a new SubstanceBuilder.
   * 
   * @param {string} name - Name of the substance.
   * @param {boolean} isModification - Whether this modifies an existing substance.
   */
  constructor(name, isModification) {
    const self = this;
    self._name = name;
    self._isModification = isModification;
    self._initialCharges = [];
    self._limits = [];
    self._changes = [];
    self._equals = null;
    self._recharge = null;
    self._recycles = [];
    self._replaces = [];
    self._retire = null;
    self._setVals = [];
  }

  /**
   * Builds a new Substance from the current state.
   * 
   * @param {boolean} isCompatibleRaw - Whether substance should be UI-compatible.
   * @returns {Substance} The constructed substance.
   */
  build(isCompatibleRaw) {
    const self = this;

    const commandsConsolidatedInterpreted = [
      self._initialCharges,
      self._limits,
      self._recycles,
      self._replaces,
      [self._equals, self._recharge, self._retire],
      self._changes,
      self._setVals,
    ].flat();
    const isCompatibleInterpreted = commandsConsolidatedInterpreted
      .filter((x) => x !== null)
      .map((x) => x.getIsCompatible())
      .reduce((a, b) => a && b, true);

    const initialChargeTargets = self._initialCharges.map((x) => x.getTarget());
    const initialChargeTargetsUnique = new Set(initialChargeTargets);
    const initialChargesNonOverlap = initialChargeTargets.length == initialChargeTargetsUnique.size;

    const isCompatible = isCompatibleRaw && isCompatibleInterpreted && initialChargesNonOverlap;

    return new Substance(
      self._name,
      self._initialCharges,
      self._limits,
      self._changes,
      self._equals,
      self._recharge,
      self._recycles,
      self._replaces,
      self._retire,
      self._setVals,
      self._isModification,
      isCompatible,
    );
  }

  /**
   * Adds a command to the substance being built.
   * 
   * @param {Command} command - The command to add.
   * @returns {Command|IncompatibleCommand} The added command or incompatibility marker.
   */
  addCommand(command) {
    const self = this;

    const commandType = command.getTypeName();
    const compatibilityType = COMMAND_COMPATIBILITIES[commandType];
    if (compatibilityType === undefined) {
      throw "Unknown compatibility type for " + commandType;
    }

    const requiresMod = compatibilityType === "policy";
    const requiresDefinition = compatibilityType === "definition";
    const noCompat = compatibilityType === "none";

    const needsToMoveToMod = requiresMod && !self._isModification;
    const needsToMoveToDefinition = requiresDefinition && self._isModification;
    const incompatiblePlace = needsToMoveToMod || needsToMoveToDefinition || noCompat;

    const strategy = {
      "change": (x) => self.addChange(x),
      "retire": (x) => self.setRetire(x),
      "setVal": (x) => self.addSetVal(x),
      "initial charge": (x) => self.addInitialCharge(x),
      "recharge": (x) => self.setRecharge(x),
      "equals": (x) => self.setEquals(x),
      "recycle": (x) => self.addRecycle(x),
      "cap": (x) => self.addLimit(x),
      "floor": (x) => self.addLimit(x),
      "replace": (x) => self.addReplace(x),
    }[commandType];

    if (incompatiblePlace) {
      return self._makeInvalidPlacement();
    } else {
      return strategy(command);
    }
  }

  /**
   * Sets the name of the substance.
   * 
   * @param {string} newVal - New name for the substance.
   */
  setName(newVal) {
    const self = this;
    self._name = newVal;
  }

  /**
   * Adds an initial charge command.
   * 
   * @param {Command} newVal - Initial charge command to add.
   */
  addInitialCharge(newVal) {
    const self = this;
    self._initialCharges.push(newVal);
  }

  /**
   * Adds a limit command.
   * 
   * @param {LimitCommand} newVal - Limit command to add.
   */
  addLimit(newVal) {
    const self = this;
    self._limits.push(newVal);
  }

  /**
   * Adds a change command.
   * 
   * @param {Command} newVal - Change command to add.
   */
  addChange(newVal) {
    const self = this;
    self._changes.push(newVal);
  }

  /**
   * Sets the equals command.
   * 
   * @param {Command} newVal - Equals command to set.
   * @returns {Command|IncompatibleCommand} The command or incompatibility marker.
   */
  setEquals(newVal) {
    const self = this;
    self._equals = self._checkDuplicate(self._equals, newVal);
  }

  /**
   * Sets the recharge command.
   * 
   * @param {Command} newVal - Recharge command to set.
   * @returns {Command|IncompatibleCommand} The command or incompatibility marker.
   */
  setRecharge(newVal) {
    const self = this;
    self._recharge = self._checkDuplicate(self._recharge, newVal);
  }

  /**
   * Adds a recycle command.
   * 
   * @param {Command} newVal - Recycle command to add.
   */
  addRecycle(newVal) {
    const self = this;
    self._recycles.push(newVal);
  }

  /**
   * Adds a replace command.
   * 
   * @param {ReplaceCommand} newVal - Replace command to add.
   */
  addReplace(newVal) {
    const self = this;
    self._replaces.push(newVal);
  }

  /**
   * Sets the retire command.
   * 
   * @param {Command} newVal - Retire command to set.
   * @returns {Command|IncompatibleCommand} The command or incompatibility marker.
   */
  setRetire(newVal) {
    const self = this;
    self._retire = self._checkDuplicate(self._retire, newVal);
  }

  /**
   * Adds a set value command.
   * 
   * @param {Command} newVal - Set value command to add.
   */
  addSetVal(newVal) {
    const self = this;
    self._setVals.push(newVal);
  }

  /**
   * Checks for duplicate single-value commands.
   * 
   * @param {Command|null} originalVal - Existing command if any.
   * @param {Command} newVal - New command to check.
   * @returns {Command|IncompatibleCommand} The command or incompatibility marker.
   * @private
   */
  _checkDuplicate(originalVal, newVal) {
    if (originalVal === null) {
      return newVal;
    } else {
      return new IncompatibleCommand("duplicate");
    }
  }

  /**
   * Creates an incompatible command for invalid placement.
   * 
   * @returns {IncompatibleCommand} An incompatibility marker.
   * @private
   */
  _makeInvalidPlacement() {
    const self = this;
    return new IncompatibleCommand("invalid placement");
  }
}

/**
 * Represents a substance with its properties and behaviors.
 */
class Substance {
  /**
   * Creates a new Substance.
   * @param {string} name - Name of the substance.
   * @param {Command[]} charges - Initial charge commands.
   * @param {LimitCommand[]} limits - Limit commands.
   * @param {Command[]} changes - Change commands.
   * @param {Command} equals - Equals command.
   * @param {Command} recharge - Recharge command.
   * @param {Command[]} recycles - Recycle commands.
   * @param {ReplaceCommand[]} replaces - Replace commands.
   * @param {Command} retire - Retire command.
   * @param {Command[]} setVals - Set value commands.
   * @param {boolean} isMod - Whether this modifies existing substance.
   * @param {boolean} compat - Whether substance is UI-compatible.
   */
  constructor(
    name,
    charges,
    limits,
    changes,
    equals,
    recharge,
    recycles,
    replaces,
    retire,
    setVals,
    isMod,
    compat,
  ) {
    const self = this;
    self._name = name;
    self._initialCharges = charges;
    self._limits = limits;
    self._changes = changes;
    self._equals = equals;
    self._recharge = recharge;
    self._recycles = recycles;
    self._replaces = replaces;
    self._retire = retire;
    self._setVals = setVals;
    self._isModification = isMod;
    self._isCompatible = compat;
  }

  /**
   * Gets the name of this substance.
   * 
   * @returns {string} The substance name.
   */
  getName() {
    const self = this;
    return self._name;
  }

  /**
   * Gets all initial charge commands for this substance.
   * 
   * @returns {Command[]} Array of initial charge commands.
   */
  getInitialCharges() {
    const self = this;
    return self._initialCharges;
  }

  /**
   * Gets the initial charge command for a specific stream.
   * 
   * @param {string} stream - The stream to get initial charge for.
   * @returns {Command|null} The initial charge command or null if not found.
   */
  getInitialCharge(stream) {
    const self = this;
    const matching = self._initialCharges.filter((x) => x.getTarget() === stream);
    return matching.length == 0 ? null : matching[0];
  }

  /**
   * Gets all limit commands for this substance.
   * 
   * @returns {LimitCommand[]} Array of limit commands.
   */
  getLimits() {
    const self = this;
    return self._limits;
  }

  /**
   * Gets all change commands for this substance.
   * 
   * @returns {Command[]} Array of change commands.
   */
  getChanges() {
    const self = this;
    return self._changes;
  }

  /**
   * Gets the equals command for this substance.
   * 
   * @returns {Command|null} The equals command or null if not set.
   */
  getEquals() {
    const self = this;
    return self._equals;
  }

  /**
   * Gets the recharge command for this substance.
   * 
   * @returns {Command|null} The recharge command or null if not set.
   */
  getRecharge() {
    const self = this;
    return self._recharge;
  }

  /**
   * Gets all recycle commands for this substance.
   * 
   * @returns {Command[]} Array of recycle commands.
   */
  getRecycles() {
    const self = this;
    return self._recycles;
  }

  /**
   * Gets all replace commands for this substance.
   * 
   * @returns {ReplaceCommand[]} Array of replace commands.
   */
  getReplaces() {
    const self = this;
    return self._replaces;
  }

  /**
   * Gets the retire command for this substance.
   * 
   * @returns {Command|null} The retire command or null if not set.
   */
  getRetire() {
    const self = this;
    return self._retire;
  }

  /**
   * Gets all set value commands for this substance.
   * 
   * @returns {Command[]} Array of set value commands.
   */
  getSetVals() {
    const self = this;
    return self._setVals;
  }

  /**
   * Checks if this substance modifies an existing one.
   * 
   * @returns {boolean} True if this modifies an existing substance.
   */
  getIsModification() {
    const self = this;
    return self._isModification;
  }

  /**
   * Checks if this substance is compatible with UI editing.
   * 
   * @returns {boolean} True if substance can be edited in UI.
   */
  getIsCompatible() {
    const self = this;
    return self._isCompatible;
  }

  toCode(spaces) {
    const self = this;

    const baselinePieces = [];
    const addCode = buildAddCode(baselinePieces);

    const prefix = self.getIsModification() ? "modify" : "uses";
    addCode(prefix + ' substance "' + self.getName() + '"', spaces);

    const addIfGiven = (code) => {
      if (code === null) {
        return;
      }
      addCode(code, spaces + 2);
    };

    const addAllIfGiven = (codeLines) => {
      if (codeLines === null) {
        return;
      }
      codeLines.forEach(addIfGiven);
    };

    addAllIfGiven(self._getInitialChargesCode());
    addIfGiven(self._getEqualsCode());
    addAllIfGiven(self._getSetValsCode());
    addAllIfGiven(self._getChangesCode());
    addIfGiven(self._getRetireCode());
    addAllIfGiven(self._getLimitCode());
    addIfGiven(self._getRechargeCode());
    addAllIfGiven(self._getRecycleCode());
    addAllIfGiven(self._getReplaceCode());

    addCode("end substance", spaces);
    return finalizeCodePieces(baselinePieces);
  }

  /**
   * Generates code for initial charge commands.
   * 
   * @returns {string[]|null} Array of code strings or null if no charges.
   * @private
   */
  _getInitialChargesCode() {
    const self = this;
    if (self._initialCharges === null) {
      return null;
    }

    const buildInitialCharge = (initialCharge) => {
      const pieces = [
        "initial charge with",
        initialCharge.getValue().getValue(),
        initialCharge.getValue().getUnits(),
        "for",
        initialCharge.getTarget(),
      ];
      self._addDuration(pieces, initialCharge);
      return self._finalizeStatement(pieces);
    };

    return self._initialCharges.map(buildInitialCharge);
  }

  /**
   * Generates code for the equals command.
   * 
   * @returns {string|null} Code string or null if no equals command.
   * @private
   */
  _getEqualsCode() {
    const self = this;
    if (self._equals === null) {
      return null;
    }

    const pieces = [
      "equals",
      self._equals.getValue().getValue(),
      self._equals.getValue().getUnits(),
    ];
    self._addDuration(pieces, self._equals);

    return self._finalizeStatement(pieces);
  }

  /**
   * Generates code for set value commands.
   * 
   * @returns {string[]|null} Array of code strings or null if no set values.
   * @private
   */
  _getSetValsCode() {
    const self = this;
    if (self._setVals.length == 0) {
      return null;
    }

    const buildSetVal = (setVal) => {
      const pieces = [
        "set",
        setVal.getTarget(),
        "to",
        setVal.getValue().getValue(),
        setVal.getValue().getUnits(),
      ];
      self._addDuration(pieces, setVal);
      return self._finalizeStatement(pieces);
    };

    return self._setVals.map(buildSetVal);
  }

  /**
   * Generates code for change commands.
   * 
   * @returns {string[]|null} Array of code strings or null if no changes.
   * @private
   */
  _getChangesCode() {
    const self = this;
    if (self._change === null) {
      return null;
    }

    const buildChange = (change) => {
      const pieces = [
        "change",
        change.getTarget(),
        "by",
        change.getValue().getValue(),
        change.getValue().getUnits(),
      ];
      self._addDuration(pieces, change);
      return self._finalizeStatement(pieces);
    };

    return self._changes.map(buildChange);
  }

  /**
   * Generates code for the retire command.
   * 
   * @returns {string|null} Code string or null if no retire command.
   * @private
   */
  _getRetireCode() {
    const self = this;
    if (self._retire === null) {
      return null;
    }

    const pieces = [
      "retire",
      self._retire.getValue().getValue(),
      self._retire.getValue().getUnits(),
    ];
    self._addDuration(pieces, self._retire);

    return self._finalizeStatement(pieces);
  }

  /**
   * Generates code for limit commands.
   * 
   * @returns {string[]|null} Array of code strings or null if no limits.
   * @private
   */
  _getLimitCode() {
    const self = this;
    if (self._limits === null || self._limits.length == 0) {
      return null;
    }

    const buildLimit = (limit) => {
      const pieces = [
        limit.getTypeName(),
        limit.getTarget(),
        "to",
        limit.getValue().getValue(),
        limit.getValue().getUnits(),
      ];

      const displacing = limit.getDisplacing();
      if (displacing !== null && displacing !== undefined) {
        pieces.push("displacing");
        pieces.push('"' + displacing + '"');
      }

      self._addDuration(pieces, limit);
      return self._finalizeStatement(pieces);
    };

    return self._limits.map(buildLimit);
  }

  /**
   * Generates code for the recharge command.
   * 
   * @returns {string|null} Code string or null if no recharge command.
   * @private
   */
  _getRechargeCode() {
    const self = this;
    if (self._recharge === null) {
      return null;
    }

    const pieces = [
      "recharge",
      self._recharge.getTarget().getValue(),
      self._recharge.getTarget().getUnits(),
      "with",
      self._recharge.getValue().getValue(),
      self._recharge.getValue().getUnits(),
    ];
    self._addDuration(pieces, self._recharge);

    return self._finalizeStatement(pieces);
  }

  /**
   * Generates code for recycle commands.
   * 
   * @returns {string[]|null} Array of code strings or null if no recycles.
   * @private
   */
  _getRecycleCode() {
    const self = this;
    if (self._recycles === null) {
      return null;
    }

    const buildRecycle = (recycle) => {
      const pieces = [
        "recover",
        recycle.getTarget().getValue(),
        recycle.getTarget().getUnits(),
        "with",
        recycle.getValue().getValue(),
        recycle.getValue().getUnits(),
        "reuse",
      ];
      self._addDuration(pieces, recycle);

      return self._finalizeStatement(pieces);
    };

    return self._recycles.map(buildRecycle);
  }

  /**
   * Generates code for replace commands.
   * 
   * @returns {string[]|null} Array of code strings or null if no replaces.
   * @private
   */
  _getReplaceCode() {
    const self = this;
    if (self._replaces === null) {
      return null;
    }

    const buildReplace = (replace) => {
      const pieces = [
        "replace",
        replace.getVolume().getValue(),
        replace.getVolume().getUnits(),
        "of",
        replace.getSource(),
        "with",
        '"' + replace.getDestination() + '"',
      ];
      self._addDuration(pieces, replace);

      return self._finalizeStatement(pieces);
    };

    return self._replaces.map(buildReplace);
  }

  /**
   * Adds duration information to code pieces array.
   * 
   * @param {string[]} pieces - Array of code pieces to append to.
   * @param {Command} command - Command containing duration info.
   * @private
   */
  _addDuration(pieces, command) {
    const self = this;

    const duration = command.getDuration();
    if (duration === null) {
      return;
    }

    let startYear = duration.getStart();
    let endYear = duration.getEnd();
    if (startYear === null && endYear === null) {
      return;
    }

    if (startYear == endYear) {
      pieces.push("during year " + startYear);
      return;
    }

    if (startYear === null) {
      startYear = "beginning";
    }

    if (endYear === null) {
      endYear = "onwards";
    }

    pieces.push("during years " + startYear + " to " + endYear);
  }

  /**
   * Joins code pieces into a single statement.
   * 
   * @param {string[]} pieces - Array of code pieces to join.
   * @returns {string} The combined code statement.
   * @private
   */
  _finalizeStatement(pieces) {
    const self = this;
    return pieces.map((x) => x + "").join(" ");
  }
}

/**
 * Represents a basic command with type, target, value and duration.
 */
class Command {
  /**
   * Creates a new Command.
   * @param {string} typeName - Type of the command.
   * @param {string} target - Target of the command.
   * @param {EngineNumber} value - Value for the command.
   * @param {YearMatcher} duration - Duration for the command.
   */
  constructor(typeName, target, value, duration) {
    const self = this;
    self._typeName = typeName;
    self._target = target;
    self._value = value;
    self._duration = duration;
  }

  /**
   * Gets the type name of this command.
   * 
   * @returns {string} The command type name (e.g. "change", "retire", "setVal", etc).
   */
  getTypeName() {
    const self = this;
    return self._typeName;
  }

  /**
   * Gets the target of this command.
   * 
   * @returns {string} The target name (e.g. "manufacture", "import", etc).
   */
  getTarget() {
    const self = this;
    return self._target;
  }

  /**
   * Gets the value associated with this command.
   * 
   * @returns {EngineNumber} The command's value with units.
   */
  getValue() {
    const self = this;
    return self._value;
  }

  /**
   * Gets the duration for which this command applies.
   * 
   * @returns {YearMatcher} The duration specification, or null for all years.
   */
  getDuration() {
    const self = this;
    return self._duration;
  }

  /**
   * Checks if this command is compatible with UI editing.
   * 
   * @returns {boolean} Always returns true as basic commands are UI-compatible.
   */
  getIsCompatible() {
    const self = this;
    return true;
  }
}

/**
 * Represents a limit command with displacement capability.
 */
class LimitCommand {
  /**
   * Creates a new LimitCommand.
   * @param {string} typeName - Type of limit (cap/floor).
   * @param {string} target - Target of the limit.
   * @param {EngineNumber} value - Limit value.
   * @param {YearMatcher} duration - Duration of limit.
   * @param {string} displacing - Substance being displaced.
   */
  constructor(typeName, target, value, duration, displacing) {
    const self = this;
    self._typeName = typeName;
    self._target = target;
    self._value = value;
    self._duration = duration;
    self._displacing = displacing;
  }

  /**
   * Gets the type name of this limit command.
   * 
   * @returns {string} The command type ("cap" or "floor").
   */
  getTypeName() {
    const self = this;
    return self._typeName;
  }

  /**
   * Gets the target of this limit command.
   * 
   * @returns {string} The target name (e.g. "manufacture", "import", etc).
   */
  getTarget() {
    const self = this;
    return self._target;
  }

  /**
   * Gets the value associated with this limit.
   * 
   * @returns {EngineNumber} The limit value with units.
   */
  getValue() {
    const self = this;
    return self._value;
  }

  /**
   * Gets the duration for which this limit applies.
   * 
   * @returns {YearMatcher} The duration specification, or null for all years.
   */
  getDuration() {
    const self = this;
    return self._duration;
  }

  /**
   * Gets the substance being displaced by this limit.
   * 
   * @returns {string|null} Name of substance being displaced, or null if none.
   */
  getDisplacing() {
    const self = this;
    return self._displacing;
  }

  /**
   * Checks if this limit command is compatible with UI editing.
   * 
   * @returns {boolean} Always returns true as limit commands are UI-compatible.
   */
  getIsCompatible() {
    const self = this;
    return true;
  }
}

/**
 * Represents a command to replace one substance with another.
 */
class ReplaceCommand {
  /**
   * Creates a new ReplaceCommand.
   * @param {EngineNumber} volume - Volume to replace.
   * @param {string} source - Source substance.
   * @param {string} destination - Destination substance.
   * @param {YearMatcher} duration - Duration of replacement.
   */
  constructor(volume, source, destination, duration) {
    const self = this;
    self._volume = volume;
    self._source = source;
    self._destination = destination;
    self._duration = duration;
  }

  /**
   * Gets the type name of this replace command.
   * 
   * @returns {string} Always returns "replace".
   */
  getTypeName() {
    const self = this;
    return "replace";
  }

  /**
   * Gets the volume to be replaced.
   * 
   * @returns {EngineNumber} The volume with units.
   */
  getVolume() {
    const self = this;
    return self._volume;
  }

  /**
   * Gets the source substance to replace from.
   * 
   * @returns {string} Name of source substance.
   */
  getSource() {
    const self = this;
    return self._source;
  }

  /**
   * Gets the destination substance to replace with.
   * 
   * @returns {string} Name of destination substance.
   */
  getDestination() {
    const self = this;
    return self._destination;
  }

  /**
   * Gets the duration for which this replacement applies.
   * 
   * @returns {YearMatcher} The duration specification, or null for all years.
   */
  getDuration() {
    const self = this;
    return self._duration;
  }

  /**
   * Checks if this replace command is compatible with UI editing.
   * 
   * @returns {boolean} Always returns true as replace commands are UI-compatible.
   */
  getIsCompatible() {
    const self = this;
    return true;
  }
}

/**
 * Represents a command that is not compatible with the UI editor.
 */
class IncompatibleCommand {
  /**
   * Creates a new IncompatibleCommand.
   * @param {string} typeName - Type of incompatible command.
   */
  constructor(typeName) {
    const self = this;
    self._typeName = typeName;
  }

  getTypeName() {
    const self = this;
    return self._typeName;
  }

  getIsCompatible() {
    const self = this;
    return false;
  }
}

/**
 * Visitor which compiles a QubecTalk program to JS objects describing the analysis.
 *
 * Visitor which attempts to compile a QubecTalk program to JS objects describing the anlaysis or
 * indication that the anlaysis cannot use the simplified JS object format.
 */
class TranslatorVisitor extends toolkit.QubecTalkVisitor {
  visitNumber(ctx) {
    const self = this;

    const raw = ctx.getText();
    const signMultiplier = raw.includes("-") ? -1 : 1;
    const bodyRawText = ctx.getChild(ctx.getChildCount() - 1).getText();
    const bodyParsed = signMultiplier * parseFloat(bodyRawText);

    return bodyParsed;
  }

  visitString(ctx) {
    const self = this;
    return self._getStringWithoutQuotes(ctx.getText());
  }

  visitUnitOrRatio(ctx) {
    const self = this;
    if (ctx.getChildCount() == 1) {
      return ctx.getChild(0).getText();
    } else {
      const numerator = ctx.getChild(0).getText();
      const denominator = ctx.getChild(2).getText();
      return numerator + " / " + denominator;
    }
  }

  visitUnitValue(ctx) {
    const self = this;

    const unitString = ctx.getChild(1).accept(self);
    const expressionContent = ctx.getChild(0).accept(self);

    return new EngineNumber(expressionContent, unitString);
  }

  visitSimpleExpression(ctx) {
    const self = this;
    return ctx.getChild(0).accept(self);
  }

  visitConditionExpression(ctx) {
    const self = this;

    const posExpression = ctx.pos.accept(self);
    const opFunc = ctx.op.text;
    const negExpression = ctx.neg.accept(self);

    return posExpression + " " + opFunc + " " + negExpression;
  }

  visitConditionalExpression(ctx) {
    const self = this;

    const condition = ctx.cond.accept(self);
    const positive = ctx.pos.accept(self);
    const negative = ctx.neg.accept(self);

    return positive + " if " + condition + " else " + negative + " endif";
  }

  buildAirthmeticExpression(ctx, op) {
    const self = this;

    const priorExpression = ctx.getChild(0).accept(self);
    const afterExpression = ctx.getChild(2).accept(self);

    return priorExpression + " " + op + " " + afterExpression;
  }

  visitAdditionExpression(ctx) {
    const self = this;
    return self.buildAirthmeticExpression(ctx, ctx.op.text);
  }

  visitMultiplyExpression(ctx) {
    const self = this;
    return self.buildAirthmeticExpression(ctx, ctx.op.text);
  }

  visitPowExpression(ctx) {
    const self = this;
    return self.buildAirthmeticExpression(ctx, "^");
  }

  visitGetStream(ctx) {
    const self = this;
    return ctx.getText();
  }

  visitGetStreamIndirect(ctx) {
    const self = this;
    return ctx.getText();
  }

  visitGetStreamConversion(ctx) {
    const self = this;
    return ctx.getText();
  }

  visitGetStreamIndirectSubstanceAppUnits(ctx) {
    const self = this;
    return ctx.getText();
  }

  visitLimitMinExpression(ctx) {
    const self = this;
    return ctx.getText();
  }

  visitLimitMaxExpression(ctx) {
    const self = this;
    return ctx.getText();
  }

  visitLimitBoundExpression(ctx) {
    const self = this;
    return ctx.getText();
  }

  visitParenExpression(ctx) {
    const self = this;
    return ctx.getText();
  }

  visitDrawNormalExpression(ctx) {
    const self = this;
    return ctx.getText();
  }

  visitDrawUniformExpression(ctx) {
    const self = this;
    return ctx.getText();
  }

  visitSimpleIdentifier(ctx) {
    const self = this;
    const identifier = ctx.getChild(0).getText();
    return identifier;
  }

  buildDuring(minYear, maxYear) {
    const self = this;
    return new YearMatcher(minYear, maxYear);
  }

  visitDuringSingleYear(ctx) {
    const self = this;
    const year = ctx.target.accept(self);
    return self.buildDuring(year, year);
  }

  visitDuringStart(ctx) {
    const self = this;
    const startYear = engine.getStartYear();
    return self.buildDuring(startYear, startYear);
  }

  visitDuringRange(ctx) {
    const self = this;
    const lower = ctx.lower.accept(self);
    const upper = ctx.upper.accept(self);
    return self.buildDuring(lower, upper);
  }

  visitDuringWithMin(ctx) {
    const self = this;
    const lower = ctx.lower.accept(self);
    const upper = null;
    return self.buildDuring(lower, upper);
  }

  visitDuringWithMax(ctx) {
    const self = this;
    const lower = null;
    const upper = ctx.upper.accept(self);
    return self.buildDuring(lower, upper);
  }

  visitDuringAll(ctx) {
    const self = this;
    return (engine) => null;
  }

  visitAboutStanza(ctx) {
    const self = this;
    return new AboutStanza();
  }

  visitDefaultStanza(ctx) {
    const self = this;
    const numApplications = ctx.getChildCount() - 4;

    const appChildren = [];
    for (let i = 0; i < numApplications; i++) {
      appChildren.push(ctx.getChild(i + 2));
    }

    const applications = appChildren.map((x) => x.accept(self));
    const isCompatible = self._getChildrenCompatible(applications);
    return new DefinitionalStanza("default", applications, isCompatible);
  }

  visitPolicyStanza(ctx) {
    const self = this;
    const policyName = self._getStringWithoutQuotes(ctx.name.getText());
    const numApplications = ctx.getChildCount() - 5;

    const appChildren = [];
    for (let i = 0; i < numApplications; i++) {
      appChildren.push(ctx.getChild(i + 3));
    }

    const applications = appChildren.map((x) => x.accept(self));
    const isCompatible = self._getChildrenCompatible(applications);
    return new DefinitionalStanza(policyName, applications, isCompatible);
  }

  visitSimulationsStanza(ctx) {
    const self = this;
    const numApplications = ctx.getChildCount() - 4;

    const children = [];
    for (let i = 0; i < numApplications; i++) {
      children.push(ctx.getChild(i + 2));
    }

    const scenarios = children.map((x) => x.accept(self));
    const isCompatible = self._getChildrenCompatible(scenarios);
    return new SimulationStanza(scenarios, isCompatible);
  }

  visitApplicationDef(ctx) {
    const self = this;
    return self._parseApplication(ctx, false);
  }

  visitSubstanceDef(ctx) {
    const self = this;
    return self._parseSubstance(ctx, false);
  }

  visitApplicationMod(ctx) {
    const self = this;
    return self._parseApplication(ctx, true);
  }

  visitSubstanceMod(ctx) {
    const self = this;
    return self._parseSubstance(ctx, true);
  }

  visitLimitCommandAllYears(ctx) {
    const self = this;
    return self._buildLimit(ctx, null, null);
  }

  visitLimitCommandDisplacingAllYears(ctx) {
    const self = this;
    const displaceTarget = self._getStringWithoutQuotes(ctx.getChild(5).getText());
    return self._buildLimit(ctx, null, displaceTarget);
  }

  visitLimitCommandDuration(ctx) {
    const self = this;
    const duration = ctx.duration.accept(self);
    return self._buildLimit(ctx, duration, null);
  }

  visitLimitCommandDisplacingDuration(ctx) {
    const self = this;
    const duration = ctx.duration.accept(self);
    const displaceTarget = self._getStringWithoutQuotes(ctx.getChild(5).getText());
    return self._buildLimit(ctx, duration, displaceTarget);
  }

  visitChangeAllYears(ctx) {
    const self = this;
    return self._buildOperation(ctx, "change", null);
  }

  visitChangeDuration(ctx) {
    const self = this;
    const duration = ctx.duration.accept(self);
    return self._buildOperation(ctx, "change", duration);
  }

  visitDefineVarStatement(ctx) {
    const self = this;
    return new IncompatibleCommand("define var");
  }

  visitInitialChargeAllYears(ctx) {
    const self = this;
    return self._buildOperation(ctx, "initial charge", null);
  }

  visitInitialChargeDuration(ctx) {
    const self = this;
    const duration = ctx.duration.accept(self);
    return self._buildOperation(ctx, "initial charge", duration);
  }

  visitRechargeAllYears(ctx) {
    const self = this;
    const populationFuture = (ctx) => ctx.population.accept(self);
    const volumeFuture = (ctx) => ctx.volume.accept(self);
    return self._buildOperation(ctx, "recharge", null, populationFuture, volumeFuture);
  }

  visitRechargeDuration(ctx) {
    const self = this;
    const populationFuture = (ctx) => ctx.population.accept(self);
    const volumeFuture = (ctx) => ctx.volume.accept(self);
    const duration = ctx.duration.accept(self);
    return self._buildOperation(ctx, "recharge", duration, populationFuture, volumeFuture);
  }

  visitRecoverAllYears(ctx) {
    const self = this;
    const volumeFuture = (ctx) => ctx.volume.accept(self);
    const yieldFuture = (ctx) => ctx.yieldVal.accept(self);
    return self._buildOperation(ctx, "recycle", null, volumeFuture, yieldFuture);
  }

  visitRecoverDuration(ctx) {
    const self = this;
    const volumeFuture = (ctx) => ctx.volume.accept(self);
    const yieldFuture = (ctx) => ctx.yieldVal.accept(self);
    const duration = ctx.duration.accept(self);
    return self._buildOperation(ctx, "recycle", duration, volumeFuture, yieldFuture);
  }

  visitRecoverDisplacementAllYears(ctx) {
    const self = this;
    return new IncompatibleCommand("recover with displace");
  }

  visitRecoverDisplacementDuration(ctx) {
    const self = this;
    return new IncompatibleCommand("recover with displace");
  }

  visitReplaceAllYears(ctx) {
    const self = this;
    const volume = ctx.volume.accept(self);
    const source = ctx.target.getText();
    const destination = self._getStringWithoutQuotes(ctx.destination.getText());
    return new ReplaceCommand(volume, source, destination, null);
  }

  visitReplaceDuration(ctx) {
    const self = this;
    const volume = ctx.volume.accept(self);
    const duration = ctx.duration.accept(self);
    const source = ctx.target.getText();
    const destination = self._getStringWithoutQuotes(ctx.destination.getText());
    return new ReplaceCommand(volume, source, destination, duration);
  }

  visitRetireAllYears(ctx) {
    const self = this;
    const targetFuture = (ctx) => null;
    const volumeFuture = (ctx) => ctx.volume.accept(self);
    return self._buildOperation(ctx, "retire", null, targetFuture, volumeFuture);
  }

  visitRetireDuration(ctx) {
    const self = this;
    const targetFuture = (ctx) => null;
    const volumeFuture = (ctx) => ctx.volume.accept(self);
    const duration = ctx.duration.accept(self);
    return self._buildOperation(ctx, "retire", duration, targetFuture, volumeFuture);
  }

  visitSetAllYears(ctx) {
    const self = this;
    return self._buildOperation(ctx, "setVal", null);
  }

  visitSetDuration(ctx) {
    const self = this;
    const duration = ctx.duration.accept(self);
    return self._buildOperation(ctx, "setVal", duration);
  }

  visitEqualsAllYears(ctx) {
    const self = this;
    const targetFuture = (ctx) => null;
    return self._buildOperation(ctx, "equals", null, targetFuture);
  }

  visitEqualsDuration(ctx) {
    const self = this;
    const targetFuture = (ctx) => null;
    const duration = ctx.duration.accept(self);
    return self._buildOperation(ctx, "equals", duration, targetFuture);
  }

  visitBaseSimulation(ctx) {
    const self = this;
    const name = self._getStringWithoutQuotes(ctx.name.getText());
    const yearStart = ctx.start.getText();
    const yearEnd = ctx.end.getText();
    return new SimulationScenario(name, [], yearStart, yearEnd, true);
  }

  visitPolicySim(ctx) {
    const self = this;
    const name = self._getStringWithoutQuotes(ctx.name.getText());
    const numPolicies = Math.ceil((ctx.getChildCount() - 8) / 2);
    const yearStart = ctx.start.getText();
    const yearEnd = ctx.end.getText();

    const policies = [];
    for (let i = 0; i < numPolicies; i++) {
      const rawName = ctx.getChild(i * 2 + 3).getText();
      const nameNoQuotes = self._getStringWithoutQuotes(rawName);
      policies.push(nameNoQuotes);
    }

    return new SimulationScenario(name, policies, yearStart, yearEnd, true);
  }

  visitBaseSimulationTrials(ctx) {
    const self = this;
    return new IncompatibleCommand("simulate with trials");
  }

  visitPolicySimTrials(ctx) {
    const self = this;
    return new IncompatibleCommand("simulate with trials");
  }

  visitProgram(ctx) {
    const self = this;

    const stanzasByName = new Map();
    const numStanzas = ctx.getChildCount();

    for (let i = 0; i < numStanzas; i++) {
      const newStanza = ctx.getChild(i).accept(self);
      stanzasByName.set(newStanza.getName(), newStanza);
    }

    if (!stanzasByName.has("default")) {
      return new Program([], [], [], true);
    }

    const applications = stanzasByName.get("default").getApplications();

    const allStanzaNames = Array.of(...stanzasByName.keys());
    const policies = allStanzaNames
      .filter((x) => x !== "default")
      .filter((x) => x !== "about")
      .filter((x) => x !== "simulations")
      .map((x) => stanzasByName.get(x));

    if (!stanzasByName.has("simulations")) {
      return new Program(applications, policies, [], true);
    }

    const scenarios = stanzasByName.get("simulations").getScenarios();

    const stanzas = Array.of(...stanzasByName.values());

    const isCompatible = self._getChildrenCompatible(stanzas);

    return new Program(applications, policies, scenarios, isCompatible);
  }

  visitGlobalStatement(ctx) {
    const self = this;
    return ctx.getChild(0).accept(self);
  }

  visitSubstanceStatement(ctx) {
    const self = this;
    return ctx.getChild(0).accept(self);
  }

  _getStringWithoutQuotes(target) {
    const self = this;
    return target.substring(1, target.length - 1);
  }

  _getChildrenCompatible(children) {
    const self = this;
    return children.map((x) => x.getIsCompatible()).reduce((a, b) => a && b, true);
  }

  _parseApplication(ctx, isModification) {
    const self = this;
    const name = self._getStringWithoutQuotes(ctx.name.getText());
    const numApplications = ctx.getChildCount() - 5;

    const children = [];
    for (let i = 0; i < numApplications; i++) {
      children.push(ctx.getChild(i + 3));
    }

    const childrenParsed = children.map((x) => x.accept(self));
    const isCompatible = self._getChildrenCompatible(childrenParsed);

    return new Application(name, childrenParsed, isModification, isCompatible);
  }

  _parseSubstance(ctx, isModification) {
    const self = this;
    const name = self._getStringWithoutQuotes(ctx.name.getText());
    const numChildren = ctx.getChildCount() - 5;

    const children = [];
    for (let i = 0; i < numChildren; i++) {
      children.push(ctx.getChild(i + 3));
    }

    const commands = children.map((x) => {
      return x.accept(self);
    });

    const builder = new SubstanceBuilder(name, isModification);

    commands.forEach((x) => {
      builder.addCommand(x);
    });

    const isCompatibleRaw = commands.map((x) => x.getIsCompatible()).reduce((a, b) => a && b, true);

    return builder.build(isCompatibleRaw);
  }

  _buildOperation(ctx, typeName, duration, targetGetter, valueGetter) {
    const self = this;
    if (targetGetter === undefined || targetGetter === null) {
      targetGetter = (ctx) => ctx.target.getText();
    }
    const target = targetGetter(ctx);

    if (valueGetter === undefined || valueGetter === null) {
      valueGetter = (ctx) => ctx.value.accept(self);
    }
    const value = valueGetter(ctx);

    return new Command(typeName, target, value, duration);
  }

  _buildLimit(ctx, duration, displaceTarget, targetGetter, valueGetter) {
    const self = this;
    const capType = ctx.getChild(0).getText();

    if (targetGetter === undefined || targetGetter === null) {
      targetGetter = (ctx) => ctx.target.getText();
    }
    const target = targetGetter(ctx);

    if (valueGetter === undefined || valueGetter === null) {
      valueGetter = (ctx) => ctx.value.accept(self);
    }
    const value = valueGetter(ctx);

    return new LimitCommand(capType, target, value, duration, displaceTarget);
  }
}

/**
 * Structure contianing the result of attempting to translate from QubecTalk script.
 */
class TranslationResult {
  /**
   * Create a new record of a translation attempt.
   *
   * @param program The translated program as a lambda if successful or null if unsuccessful.
   * @param errors Any errors enountered or empty list if no errors.
   */
  constructor(program, errors) {
    const self = this;
    self._program = program;
    self._errors = errors;
  }

  /**
   * Get the program as an oject.
   *
   * @returns The compiled program as an object or null if translation failed.
   */
  getProgram() {
    const self = this;
    return self._program;
  }

  /**
   * Get errors encountered in compiling the QubecTalk script.
   *
   * @returns Errors or empty list if no errors.
   */
  getErrors() {
    const self = this;
    return self._errors;
  }
}

class UiTranslatorCompiler {
  compile(input) {
    const self = this;

    if (input.replaceAll("\n", "").replaceAll(" ", "") === "") {
      return new TranslationResult(null, []);
    }

    const errors = [];

    const chars = new toolkit.antlr4.InputStream(input);
    const lexer = new toolkit.QubecTalkLexer(chars);
    lexer.removeErrorListeners();
    lexer.addErrorListener({
      syntaxError: (recognizer, offendingSymbol, line, column, msg, err) => {
        const result = `(line ${line}, col ${column}): ${msg}`;
        errors.push(result);
      },
    });

    const tokens = new toolkit.antlr4.CommonTokenStream(lexer);
    const parser = new toolkit.QubecTalkParser(tokens);

    parser.buildParsePlastics = true;
    parser.removeErrorListeners();
    parser.addErrorListener({
      syntaxError: (recognizer, offendingSymbol, line, column, msg, err) => {
        const result = `(line ${line}, col ${column}): ${msg}`;
        errors.push(result);
      },
    });

    const programUncompiled = parser.program();

    if (errors.length > 0) {
      return new TranslationResult(null, errors);
    }

    const program = programUncompiled.accept(new TranslatorVisitor());
    if (errors.length > 0) {
      return new TranslationResult(null, errors);
    }

    return new TranslationResult(program, errors);
  }
}

export {
  AboutStanza,
  Application,
  Command,
  DefinitionalStanza,
  LimitCommand,
  Program,
  ReplaceCommand,
  SimulationScenario,
  SimulationStanza,
  Substance,
  SubstanceBuilder,
  UiTranslatorCompiler,
  buildAddCode,
  finalizeCodePieces,
  indent,
};
