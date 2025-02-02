/**
 * Logic to interpret a plastics language script.
 *
 * @license BSD, see LICENSE.md.
 */

import {EngineNumber} from "engine_number";
import {Engine} from "engine";
import {YearMatcher} from "engine_state";

const toolkit = QubecTalk.getToolkit();

/**
 * A visitor class that compiles QubecTalk code into executable functions
 * @extends {toolkit.QubecTalkVisitor}
 */
class CompileVisitor extends toolkit.QubecTalkVisitor {
  /**
   * Visits a number node in the AST
   * @param {Object} ctx - The parser context containing the number
   * @returns {Function} A function that returns the parsed number
   */
  visitNumber(ctx) {
    const self = this;

    const raw = ctx.getText();
    const signMultiplier = raw.includes("-") ? -1 : 1;
    const bodyRawText = ctx.getChild(ctx.getChildCount() - 1).getText();
    const prefix = bodyRawText.startsWith(".") ? "0" : "";
    const bodyRawTextPrefixed = prefix + bodyRawText;
    const bodyParsed = signMultiplier * parseFloat(bodyRawTextPrefixed);

    return (engine) => bodyParsed;
  }

  /**
   * Process a string literal node in the AST
   * @param {Object} ctx - The parser context containing the string
   * @returns {Function} A function that returns the string without quotes
   */
  visitString(ctx) {
    const self = this;
    return (engine) => self._getStringWithoutQuotes(ctx.getText());
  }

  /**
   * Process a unit or ratio node in the AST
   * @param {Object} ctx - The parser context containing the unit or ratio
   * @returns {string} The unit string or ratio expression
   */
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

  /**
   * Process a value with units node in the AST
   * @param {Object} ctx - The parser context containing the value and unit
   * @returns {Function} A function that returns an EngineNumber with the value and unit
   */
  visitUnitValue(ctx) {
    const self = this;

    const unitString = ctx.getChild(1).accept(self);
    const expressionFuture = ctx.getChild(0).accept(self);

    return (engine) => {
      const value = expressionFuture(engine);
      return new EngineNumber(value, unitString);
    };
  }

  /**
   * Process a simple expression node in the AST
   * @param {Object} ctx - The parser context containing the expression
   * @returns {Function} A function that evaluates the expression
   */
  visitSimpleExpression(ctx) {
    const self = this;
    return ctx.getChild(0).accept(self);
  }

  /**
   * Process a conditional comparison expression
   * @param {Object} ctx - The parser context containing the condition
   * @returns {Function} A function that evaluates the condition and returns 1 (true) or 0 (false)
   */
  visitConditionExpression(ctx) {
    const self = this;

    const posExpression = ctx.pos.accept(self);
    const opFunc = {
      "==": (a, b) => a == b,
      "!=": (a, b) => a != b,
      "<": (a, b) => a < b,
      ">": (a, b) => a > b,
      ">=": (a, b) => a >= b,
      "<=": (a, b) => a <= b,
    }[ctx.op.text];
    const negExpression = ctx.neg.accept(self);

    return (engine) => {
      const result = opFunc(posExpression(engine), negExpression(engine));
      return result ? 1 : 0;
    };
  }

  /**
   * Process an if-then-else conditional expression
   * @param {Object} ctx - The parser context containing the condition and branches
   * @returns {Function} A function that evaluates the condition and returns the appropriate branch result
   */
  visitConditionalExpression(ctx) {
    const self = this;

    const condition = ctx.cond.accept(self);
    const positive = ctx.pos.accept(self);
    const negative = ctx.neg.accept(self);

    return (state) => {
      if (condition(state) == 1) {
        return positive(state);
      } else {
        return negative(state);
      }
    };
  }

  /**
   * Build an arithmetic expression function
   * @param {Object} ctx - The parser context containing the expression
   * @param {string} op - The operator to use (+, -, *, /, ^)
   * @returns {Function} A function that evaluates the arithmetic expression
   */
  buildAirthmeticExpression(ctx, op) {
    const self = this;

    const priorExpression = ctx.getChild(0).accept(self);
    const opFunc = {
      "+": (a, b) => a + b,
      "-": (a, b) => a - b,
      "*": (a, b) => a * b,
      "/": (a, b) => a / b,
      "^": (a, b) => Math.pow(a, b),
    }[op];
    const afterExpression = ctx.getChild(2).accept(self);

    return (engine) => {
      return opFunc(priorExpression(engine), afterExpression(engine));
    };
  }

  /**
   * Process an addition or subtraction expression
   * @param {Object} ctx - The parser context containing the expression
   * @returns {Function} A function that evaluates the addition/subtraction
   */
  visitAdditionExpression(ctx) {
    const self = this;
    return self.buildAirthmeticExpression(ctx, ctx.op.text);
  }

  /**
   * Process a multiplication or division expression
   * @param {Object} ctx - The parser context containing the expression
   * @returns {Function} A function that evaluates the multiplication/division
   */
  visitMultiplyExpression(ctx) {
    const self = this;
    return self.buildAirthmeticExpression(ctx, ctx.op.text);
  }

  /**
   * Process an exponentiation expression
   * @param {Object} ctx - The parser context containing the expression
   * @returns {Function} A function that evaluates the exponentiation
   */
  visitPowExpression(ctx) {
    const self = this;
    return self.buildAirthmeticExpression(ctx, "^");
  }

  /**
   * Builds a function that retrieves a stream's value
   * @param {string} target - The target stream identifier
   * @param {Function|null} rescopeFuture - Function to handle rescoping or null
   * @param {string|null} conversionMaybe - Optional conversion specification
   * @returns {Function} A function that retrieves the stream value
   */
  buildStreamGetExpression(target, rescopeFuture, conversionMaybe) {
    const self = this;

    return (engine) => {
      const rescope = rescopeFuture === null ? null : rescopeFuture(engine);
      return engine.getStream(target, rescope, conversionMaybe).getValue();
    };
  }

  /**
   * Process a direct stream access
   * @param {Object} ctx - The parser context for stream access
   * @returns {Function} A function that gets the stream value
   */
  visitGetStream(ctx) {
    const self = this;
    return self.buildStreamGetExpression(ctx.target.getText(), null, null);
  }

  /**
   * Process an indirect stream access with rescoping
   * @param {Object} ctx - The parser context for indirect stream access
   * @returns {Function} A function that gets the rescoped stream value
   */
  visitGetStreamIndirect(ctx) {
    const self = this;
    return self.buildStreamGetExpression(ctx.target.getText(), ctx.rescope.accept(self), null);
  }

  /**
   * Process a stream access with unit conversion
   * @param {Object} ctx - The parser context for stream access with conversion
   * @returns {Function} A function that gets the converted stream value
   */
  visitGetStreamConversion(ctx) {
    const self = this;
    return self.buildStreamGetExpression(ctx.target.getText(), null, ctx.conversion.accept(self));
  }

  /**
   * Process an indirect stream access with substance application units
   * @param {Object} ctx - The parser context for substance-specific stream access
   */
  visitGetStreamIndirectSubstanceAppUnits(ctx) {
    const self = this;
    return self.buildStreamGetExpression(
      ctx.target.getText(),
      ctx.rescope.accept(self),
      ctx.conversion.accept(self),
    );
  }

  /**
   * Process a min limit expression that sets a minimum value
   * @param {Object} ctx - The parser context containing the min expression
   * @returns {Function} A function that evaluates and returns the limited value
   */
  visitLimitMinExpression(ctx) {
    const self = this;

    const operandFuture = ctx.operand.accept(self);
    const minimumFuture = ctx.limit.accept(self);

    return (engine) => {
      const operand = operandFuture(engine);
      const minimum = minimumFuture(engine);
      return operand < minimum ? minimum : operand;
    };
  }

  /**
   * Process a max limit expression that sets a maximum value
   * @param {Object} ctx - The parser context containing the max expression
   * @returns {Function} A function that evaluates and returns the limited value
   */
  visitLimitMaxExpression(ctx) {
    const self = this;

    const operandFuture = ctx.operand.accept(self);
    const maximumFuture = ctx.limit.accept(self);

    return (engine) => {
      const operand = operandFuture(engine);
      const maximum = maximumFuture(engine);
      return operand > maximum ? maximum : operand;
    };
  }

  /**
   * Process a bound expression that sets both minimum and maximum values
   * @param {Object} ctx - The parser context containing the bound expression
   * @returns {Function} A function that evaluates and returns the bounded value
   */
  visitLimitBoundExpression(ctx) {
    const self = this;

    const operandFuture = ctx.operand.accept(self);
    const minimumFuture = ctx.lower.accept(self);
    const maximumFuture = ctx.upper.accept(self);

    return (engine) => {
      const operand = operandFuture(engine);
      const minimum = minimumFuture(engine);
      const maximum = maximumFuture(engine);
      if (operand < minimum) {
        return minimum;
      } else if (operand > maximum) {
        return maximum;
      } else {
        return operand;
      }
    };
  }

  /**
   * Process a parenthetical expression
   * @param {Object} ctx - The parser context containing the parenthetical expression
   * @returns {Function} A function that evaluates the expression inside parentheses
   */
  visitParenExpression(ctx) {
    const self = this;
    return ctx.getChild(1).accept(self);
  }

  /**
   * Process an expression for drawing from a normal distribution
   * @param {Object} ctx - The parser context containing the normal distribution parameters
   * @returns {Function} A function that generates normally distributed random values
   */
  visitDrawNormalExpression(ctx) {
    const self = this;
    const meanFuture = ctx.mean.accept(self);
    const stdFuture = ctx.std.accept(self);

    return (engine) => {
      const meanValue = meanFuture(engine);
      const stdValue = stdFuture(engine);
      const generator = d3.randomNormal(meanValue, stdValue);
      return generator();
    };
  }

  /**
   * Process an expression for drawing from a uniform distribution
   * @param {Object} ctx - The parser context containing the uniform distribution parameters
   * @returns {Function} A function that generates uniformly distributed random values
   */
  visitDrawUniformExpression(ctx) {
    const self = this;
    const lowFuture = ctx.low.accept(self);
    const highFuture = ctx.high.accept(self);

    return (engine) => {
      const lowValue = lowFuture(engine);
      const highValue = highFuture(engine);
      const generator = d3.randomUniform(lowValue, highValue);
      return generator();
    };
  }

  /**
   * Process a simple identifier node in the AST
   * @param {Object} ctx - The parser context containing the identifier
   * @returns {Function} A function that retrieves the variable value from the engine
   */
  visitSimpleIdentifier(ctx) {
    const self = this;
    const identifier = ctx.getChild(0).getText();

    return (engine) => {
      return engine.getVariable(identifier);
    };
  }

  /**
   * Build a function that creates a year duration matcher
   * @param {Function|null} minYearMaybe - Function to get minimum year or null
   * @param {Function|null} maxYearMaybe - Function to get maximum year or null
   * @returns {Function} A function that returns a YearMatcher object
   */
  buildDuring(minYearMaybe, maxYearMaybe) {
    const self = this;
    return (engine) => {
      const minYear = minYearMaybe === null ? null : minYearMaybe(engine);
      const maxYear = maxYearMaybe === null ? null : maxYearMaybe(engine);
      return new YearMatcher(minYear, maxYear);
    };
  }

  visitDuringSingleYear(ctx) {
    const self = this;
    const yearFuture = ctx.target.accept(self);
    return self.buildDuring(yearFuture, yearFuture);
  }

  visitDuringStart(ctx) {
    const self = this;
    const getStartYear = (engine) => engine.getStartYear();
    return self.buildDuring(getStartYear, getStartYear);
  }

  visitDuringRange(ctx) {
    const self = this;
    const lowerFuture = ctx.lower.accept(self);
    const upperFuture = ctx.upper.accept(self);
    return self.buildDuring(lowerFuture, upperFuture);
  }

  visitDuringWithMin(ctx) {
    const self = this;
    const lowerFuture = ctx.lower.accept(self);
    const upperFuture = (engine) => engine.getEndYear();
    return self.buildDuring(lowerFuture, upperFuture);
  }

  visitDuringWithMax(ctx) {
    const self = this;
    const lowerFuture = (engine) => engine.getStartYear();
    const upperFuture = ctx.upper.accept(self);
    return self.buildDuring(lowerFuture, upperFuture);
  }

  visitDuringAll(ctx) {
    const self = this;
    return (engine) => null;
  }

  /**
   * Process an about stanza node in the AST
   * @param {Object} ctx - The parser context for the about stanza
   * @returns {Object} A stanza descriptor object
   */
  visitAboutStanza(ctx) {
    const self = this;
    return {name: "about"};
  }

  /**
   * Process a default stanza node in the AST
   * @param {Object} ctx - The parser context for the default stanza
   * @returns {Object} A stanza descriptor object with executable function
   */
  visitDefaultStanza(ctx) {
    const self = this;
    const numApplications = ctx.getChildCount() - 4;

    const appChildren = [];
    for (let i = 0; i < numApplications; i++) {
      appChildren.push(ctx.getChild(i + 2));
    }

    const appCommands = appChildren.map((x) => x.accept(self));
    const execute = (engine) => {
      engine.setStanza("default");
      appCommands.forEach((command) => command(engine));
    };
    return {name: "default", executable: execute};
  }

  /**
   * Process a policy stanza node in the AST
   * @param {Object} ctx - The parser context for the policy stanza
   * @returns {Object} A stanza descriptor object with executable function
   */
  visitPolicyStanza(ctx) {
    const self = this;
    const policyName = self._getStringWithoutQuotes(ctx.name.getText());
    const numApplications = ctx.getChildCount() - 5;

    const appChildren = [];
    for (let i = 0; i < numApplications; i++) {
      appChildren.push(ctx.getChild(i + 3));
    }

    const appCommands = appChildren.map((x) => x.accept(self));
    const execute = (engine) => {
      engine.setStanza("policy " + policyName);
      appCommands.forEach((command) => command(engine));
    };
    return {name: "policy " + policyName, executable: execute};
  }

  /**
   * Process a simulations stanza node in the AST
   * @param {Object} ctx - The parser context for the simulations stanza
   * @returns {Object} A stanza descriptor object with simulations and executable
   */
  visitSimulationsStanza(ctx) {
    const self = this;
    const numApplications = ctx.getChildCount() - 4;

    const appChildren = [];
    for (let i = 0; i < numApplications; i++) {
      appChildren.push(ctx.getChild(i + 2));
    }

    const simulations = appChildren.map((x) => x.accept(self));
    return {
      name: "simulations",
      executable: [(engine) => engine.setStanza("simulations")],
      simulations: simulations,
    };
  }

  /**
   * Build a definition processing function
   * @param {Object} ctx - The parser context for the definition
   * @param {Function} scopeSetter - Function to set the scope in the engine
   * @returns {Function} An executable function that processes the definition
   */
  buildDef(ctx, scopeSetter) {
    const self = this;
    const name = self._getStringWithoutQuotes(ctx.name.getText());
    const numChildren = ctx.getChildCount() - 5;

    const children = [];
    for (let i = 0; i < numChildren; i++) {
      children.push(ctx.getChild(i + 3));
    }

    const commands = children.map((x) => x.accept(self));
    const execute = (engine) => {
      scopeSetter(engine, name);
      commands.forEach((command) => command(engine));
    };
    return execute;
  }

  /**
   * Process an application definition node in the AST
   * @param {Object} ctx - The parser context for the application definition
   * @returns {Function} An executable function that processes the application
   */
  visitApplicationDef(ctx) {
    const self = this;
    return self.buildDef(ctx, (engine, name) => engine.setApplication(name));
  }

  visitSubstanceDef(ctx) {
    const self = this;
    return self.buildDef(ctx, (engine, name) => engine.setSubstance(name, false));
  }

  visitApplicationMod(ctx) {
    const self = this;
    return self.buildDef(ctx, (engine, name) => engine.setApplication(name));
  }

  visitSubstanceMod(ctx) {
    const self = this;
    return self.buildDef(ctx, (engine, name) => engine.setSubstance(name, true));
  }

  buildStreamMod(callback, ctx, durationFuture) {
    const self = this;
    const streamName = ctx.target.getText();
    const valueFuture = ctx.value.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      const duration = durationFuture(engine);
      callback(engine, streamName, value, duration);
    };
  }

  buildCap(ctx, durationFuture, displace) {
    const self = this;
    const capType = ctx.getChild(0).getText();
    const strategy = {
      cap: (engine, stream, value, duration) => engine.cap(stream, value, duration, displace),
      floor: (engine, stream, value, duration) => engine.floor(stream, value, duration, displace),
    }[capType];
    return self.buildStreamMod(strategy, ctx, durationFuture);
  }

  visitLimitCommandAllYears(ctx) {
    const self = this;
    return self.buildCap(ctx, (engine) => null, null);
  }

  visitLimitCommandDisplacingAllYears(ctx) {
    const self = this;
    const displaceTarget = self._getStringWithoutQuotes(ctx.getChild(5).getText());
    return self.buildCap(ctx, (engine) => null, displaceTarget);
  }

  visitLimitCommandDuration(ctx) {
    const self = this;
    const durationFuture = ctx.duration.accept(self);
    return self.buildCap(ctx, durationFuture);
  }

  visitLimitCommandDisplacingDuration(ctx) {
    const self = this;
    const durationFuture = ctx.duration.accept(self);
    const displaceTarget = self._getStringWithoutQuotes(ctx.getChild(5).getText());
    return self.buildCap(ctx, durationFuture, displaceTarget);
  }

  buildChange(ctx, durationFuture) {
    const self = this;
    return self.buildStreamMod(
      (engine, stream, value, duration) => engine.changeStream(stream, value, duration),
      ctx,
      durationFuture,
    );
  }

  visitChangeAllYears(ctx) {
    const self = this;
    return self.buildChange(ctx, (engine) => null);
  }

  visitChangeDuration(ctx) {
    const self = this;
    const durationFuture = ctx.duration.accept(self);
    return self.buildChange(ctx, durationFuture);
  }

  visitDefineVarStatement(ctx) {
    const self = this;
    const identifier = ctx.target.getText();
    const valueFuture = ctx.value.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      engine.defineVariable(identifier);
      engine.setVariable(identifier, value);
    };
  }

  visitInitialChargeAllYears(ctx) {
    const self = this;
    const stream = ctx.target.getText();
    const valueFuture = ctx.value.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      return engine.setInitialCharge(value, stream, null);
    };
  }

  visitInitialChargeDuration(ctx) {
    const self = this;
    const stream = ctx.target.getText();
    const valueFuture = ctx.value.accept(self);
    const durationFuture = ctx.duration.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      const duration = durationFuture(engine);
      return engine.setInitialCharge(value, stream, duration);
    };
  }

  visitRechargeAllYears(ctx) {
    const self = this;
    const populationFuture = ctx.population.accept(self);
    const volumeFuture = ctx.volume.accept(self);

    return (engine) => {
      const population = populationFuture(engine);
      const volume = volumeFuture(engine);
      return engine.recharge(population, volume, null);
    };
  }

  visitRechargeDuration(ctx) {
    const self = this;
    const populationFuture = ctx.population.accept(self);
    const volumeFuture = ctx.volume.accept(self);
    const durationFuture = ctx.duration.accept(self);

    return (engine) => {
      const population = populationFuture(engine);
      const volume = volumeFuture(engine);
      const duration = durationFuture(engine);
      return engine.recharge(population, volume, duration);
    };
  }

  buildRecover(ctx, displacementFuture, durationFuture) {
    const self = this;
    const volumeFuture = ctx.volume.accept(self);
    const yieldFuture = ctx.yieldVal.accept(self);

    return (engine) => {
      const volume = volumeFuture(engine);
      const yieldValue = yieldFuture(engine);
      const displacement = displacementFuture(engine);
      const duration = durationFuture(engine);
      engine.recycle(volume, yieldValue, displacement, duration);
    };
  }

  visitRecoverAllYears(ctx) {
    const self = this;
    return self.buildRecover(
      ctx,
      (engine) => null,
      (engine) => null,
    );
  }

  visitRecoverDuration(ctx) {
    const self = this;
    const durationFuture = ctx.duration.accept(self);
    return self.buildRecover(ctx, (engine) => null, durationFuture);
  }

  visitRecoverDisplacementAllYears(ctx) {
    const self = this;
    const displacementFuture = ctx.displacement.accept(self);
    return self.buildRecover(ctx, displacementFuture, (engine) => null);
  }

  visitRecoverDisplacementDuration(ctx) {
    const self = this;
    const displacementFuture = ctx.displacement.accept(self);
    const durationFuture = ctx.duration.accept(self);
    return self.buildRecover(ctx, displacementFuture, durationFuture);
  }

  visitReplaceAllYears(ctx) {
    const self = this;
    const volumeFuture = ctx.volume.accept(self);
    const stream = ctx.target.getText();
    const destination = self._getStringWithoutQuotes(ctx.destination.getText());

    return (engine) => {
      const volume = volumeFuture(engine);
      engine.replace(volume, stream, destination, null);
    };
  }

  visitReplaceDuration(ctx) {
    const self = this;
    const volumeFuture = ctx.volume.accept(self);
    const durationFuture = ctx.duration.accept(self);
    const stream = ctx.target.getText();
    const destination = self._getStringWithoutQuotes(ctx.destination.getText());

    return (engine) => {
      const volume = volumeFuture(engine);
      const duration = durationFuture(engine);
      engine.replace(volume, stream, destination, duration);
    };
  }

  /**
   * Process a retire command applying to all simulation years
   * @param {Object} ctx - The parser context for the retire command
   * @returns {Function} A function that executes the retirement
   */
  visitRetireAllYears(ctx) {
    const self = this;
    const volumeFuture = ctx.volume.accept(self);

    return (engine) => {
      const volume = volumeFuture(engine);
      return engine.retire(volume, null);
    };
  }

  /**
   * Process a retire command for a specific duration
   * @param {Object} ctx - The parser context for the retire command
   * @returns {Function} A function that executes the retirement for the specified duration
   */
  visitRetireDuration(ctx) {
    const self = this;
    const volumeFuture = ctx.volume.accept(self);
    const durationFuture = ctx.duration.accept(self);

    return (engine) => {
      const volume = volumeFuture(engine);
      const duration = durationFuture(engine);
      return engine.retire(volume, duration);
    };
  }

  /**
   * Process a set command for all simulation years
   * @param {Object} ctx - The parser context containing the set command
   * @returns {Function} A function that executes the set operation
   */
  visitSetAllYears(ctx) {
    const self = this;
    const target = ctx.target.getText();
    const valueFuture = ctx.value.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      engine.setStream(target, value, null);
    };
  }

  /**
   * Process a set command for a specific duration
   * @param {Object} ctx - The parser context containing the set command with duration
   * @returns {Function} A function that executes the set operation for the duration
   */
  visitSetDuration(ctx) {
    const self = this;
    const target = ctx.target.getText();
    const valueFuture = ctx.value.accept(self);
    const durationFuture = ctx.duration.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      const duration = durationFuture(engine);
      engine.setStream(target, value, duration);
    };
  }

  /**
   * Process an equals command for all simulation years
   * @param {Object} ctx - The parser context containing the equals command
   * @returns {Function} A function that executes the equals operation
   */
  visitEqualsAllYears(ctx) {
    const self = this;
    const valueFuture = ctx.value.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      engine.equals(value);
    };
  }

  /**
   * Process an equals command for a specific duration
   * @param {Object} ctx - The parser context containing the equals command with duration
   * @returns {Function} A function that executes the equals operation for the duration
   */
  visitEqualsDuration(ctx) {
    const self = this;
    const valueFuture = ctx.value.accept(self);
    const durationFuture = ctx.duration.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      const duration = durationFuture(engine);
      engine.equals(value, duration);
    };
  }

  buildSimulate(ctx, stanzas, futureNumTrials) {
    const self = this;
    const name = self._getStringWithoutQuotes(ctx.name.getText());
    const startFuture = ctx.start.accept(self);
    const endFuture = ctx.end.accept(self);

    return (engine) => {
      const start = startFuture(engine);
      const end = endFuture(engine);
      const numTrials = futureNumTrials(engine);
      return {name: name, stanzas: stanzas, trials: numTrials, start: start, end: end};
    };
  }

  /**
   * Process a basic simulation scenario
   * @param {Object} ctx - The parser context for the simulation
   * @returns {Function} A function that builds the simulation configuration
   */
  visitBaseSimulation(ctx) {
    const self = this;
    return self.buildSimulate(ctx, ["default"], (x) => 1);
  }

  /**
   * Process a policy simulation scenario
   * @param {Object} ctx - The parser context for the policy simulation
   * @returns {Function} A function that builds the policy simulation configuration
   */
  visitPolicySim(ctx) {
    const self = this;
    const numPolicies = Math.ceil((ctx.getChildCount() - 8) / 2);

    const policies = ["default"];
    for (let i = 0; i < numPolicies; i++) {
      const rawName = ctx.getChild(i * 2 + 3).getText();
      const nameNoQuotes = self._getStringWithoutQuotes(rawName);
      const nameComplete = "policy " + nameNoQuotes;
      policies.push(nameComplete);
    }

    return self.buildSimulate(ctx, policies, (x) => 1);
  }

  /**
   * Process a base simulation with multiple trials
   * @param {Object} ctx - The parser context containing the simulation configuration
   * @returns {Function} A function that builds the simulation with trials
   */
  visitBaseSimulationTrials(ctx) {
    const self = this;
    const futureNumTrials = ctx.trials.accept(self);
    return self.buildSimulate(ctx, ["default"], futureNumTrials);
  }

  /**
   * Process a policy simulation with multiple trials
   * @param {Object} ctx - The parser context containing the policy simulation configuration
   * @returns {Function} A function that builds the policy simulation with trials
   */
  visitPolicySimTrials(ctx) {
    const self = this;
    const numPolicies = Math.ceil((ctx.getChildCount() - 11) / 2);
    const futureNumTrials = ctx.trials.accept(self);

    const policies = [];
    for (let i = 0; i < numPolicies; i++) {
      policies.push(ctx.getChild(i * 2 + 3).accept(self));
    }

    return self.buildSimulate(ctx, policies, futureNumTrials);
  }

  /**
   * Process the complete program AST
   * @param {Object} ctx - The parser context for the entire program
   * @returns {Function} A function that executes the complete program
   */
  visitProgram(ctx) {
    const self = this;

    const stanzasByName = new Map();
    const numStanzas = ctx.getChildCount();

    for (let i = 0; i < numStanzas; i++) {
      const newStanza = ctx.getChild(i).accept(self);
      stanzasByName.set(newStanza.name, newStanza);
    }

    const execute = () => {
      if (!stanzasByName.has("simulations")) {
        throw "Need at least one simulation scenario.";
      }

      const simulationsStanza = stanzasByName.get("simulations");
      const simulationExecutables = simulationsStanza["executable"];
      const simulationFutures = simulationsStanza["simulations"];

      const bootstrapEngine = new Engine(1, 1);
      simulationExecutables.forEach((x) => x(bootstrapEngine));
      const simulations = simulationFutures.map((simulationFuture) => {
        return simulationFuture(bootstrapEngine);
      });
      const results = simulations.map((simulation) => {
        const runSimulation = () => {
          const engine = new Engine(simulation.start, simulation.end);

          const runYear = () => {
            const stanzas = simulation.stanzas;
            stanzas.forEach((stanzaName) => {
              if (!stanzasByName.get(stanzaName)) {
                throw "Could not find " + stanzaName;
              }
              const stanzaDetails = stanzasByName.get(stanzaName);
              const stanzaExecutable = stanzaDetails.executable;
              stanzaExecutable(engine);
            });
            return engine.getResults();
          };

          const yearResults = [];
          while (!engine.getIsDone()) {
            yearResults.push(runYear());
            engine.incrementYear();
          }

          return yearResults;
        };

        const trialResults = [];
        for (let i = 0; i < simulation.trials; i++) {
          trialResults.push(runSimulation());
        }

        return new SimulationResult(simulation.name, trialResults);
      });
      return results;
    };

    return execute;
  }

  /**
   * Process a global statement node in the AST
   * @param {Object} ctx - The parser context containing the global statement
   * @returns {Function} A function that executes the global statement
   */
  visitGlobalStatement(ctx) {
    const self = this;
    return ctx.getChild(0).accept(self);
  }

  /**
   * Process a substance statement node in the AST
   * @param {Object} ctx - The parser context containing the substance statement
   * @returns {Function} A function that executes the substance statement
   */
  visitSubstanceStatement(ctx) {
    const self = this;
    return ctx.getChild(0).accept(self);
  }

  /**
   * Remove surrounding quotes from a string
   * @param {string} target - The string potentially containing quotes
   * @returns {string} The string with quotes removed if present
   * @private
   */
  _getStringWithoutQuotes(target) {
    const self = this;
    if (target.startsWith('"') && target.endsWith('"')) {
      return target.substring(1, target.length - 1);
    } else {
      return target;
    }
  }
}

class SimulationResult {
  constructor(name, trialResults) {
    const self = this;
    self._name = name;
    self._trialResults = trialResults;
  }

  getName() {
    const self = this;
    return self._name;
  }

  getTrialResults() {
    const self = this;
    return self._trialResults;
  }
}

/**
 * Structure contianing the result of attempting to compile a QubecTalk script.
 */
class CompileResult {
  /**
   * Create a new record of a compilation attempt.
   *
   * @param program The compiled program as a lambda if successful or null if unsuccessful.
   * @param errors Any errors enountered or empty list if no errors.
   */
  constructor(program, errors) {
    const self = this;
    self._program = program;
    self._errors = errors;
  }

  /**
   * Get the program as a lambda.
   *
   * @returns The compiled program as a lambda or null if compilation failed.
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

class Compiler {
  compile(input) {
    const self = this;

    if (input.replaceAll("\n", "").replaceAll(" ", "") === "") {
      return new CompileResult(null, []);
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
      return new CompileResult(null, errors);
    }

    const program = programUncompiled.accept(new CompileVisitor());
    if (errors.length > 0) {
      return new CompileResult(null, errors);
    }

    return new CompileResult(program, errors);
  }
}

export {Compiler};