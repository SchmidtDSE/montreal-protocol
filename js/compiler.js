/**
 * Logic to interpret a plastics language script.
 *
 * @license BSD, see LICENSE.md.
 */

import {  EngineNumber } from "engine_number"; 
import { Engine } from "./engine";

const toolkit = QubecTalk.getToolkit();


/**
 * Visitor which compiles a QubecTalk program to JS lambdas.
 *
 * Visitor which compiles a QubecTalk program to QubecTalkProgram which contains JS lambdas and
 * simulation functions.
 */
class CompileVisitor extends toolkit.QubecTalkVisitor {
  
  visitNumber(ctx) {
    const self = this;

    const raw = ctx.getText();
    const signMultiplier = raw.includes("-") ? -1 : 1;
    const bodyRawText = ctx.getChild(ctx.getChildCount() - 1).getText();
    const bodyParsed = signMultiplier * parseFloat(bodyRawText);

    return (engine) => bodyParsed;
  }

  visitString(ctx) {
    const self = this;

    const innerString = ctx.getChild(1);
    return (engine) => innerString;
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

  visitRegularUnitValue(ctx) {
    const self = this;

    const unitString = ctx.getChild(1).getText();
    const expressionFuture = ctx.getChild(0).accept(self);

    return (engine) => {
      const value = expressionFuture(engine);
      return new EngineNumber(value, unitString);
    };
  }

  visitScaledUnitValue(ctx) {
    const self = this;

    const numeratorString = ctx.getChild(1).getText();
    const denominatorString = ctx.getChild(3).getText();
    const unitString = numeratorString + " / " + denominatorString;
    const expressionFuture = ctx.getChild(0).accept(self);

    return (engine) => {
      const value = expressionFuture(engine);
      return new EngineNumber(value, unitString);
    };
  }

  visitConditionExpression(ctx) {
    const self = this;

    const posExpression = ctx.pos.accept(self);
    let opFunc = {
      "==": (a, b) => a == b,
      "!=": (a, b) => a != b,
      "<": (a, b) => a < b,
      ">": (a, b) => a > b,
      ">=": (a, b) => a >= b,
      "<=": (a, b) => a <= b,
    }[ctx.op.text]
    const negExpression = ctx.neg.accept(self);

    return (engine) => {
      const result = opFunc(posExpression(engine), negExpression(engine));
      return result ? 1 : 0;
    };
  }

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

  buildAirthmeticExpression(ctx, op) {
    const self = this;

    const priorExpression = ctx.getChild(0).accept(self);
    const opFunc = {
      "+": (a, b) => a + b,
      "-": (a, b) => a - b,
      "*": (a, b) => a * b,
      "/": (a, b) => a / b,
      "^": (a, b) => Math.pow(a, b)
    }[op];
    const afterExpression = ctx.getChild(2).accept(self);

    return (engine) => {
      return opFunc(priorExpression(engine), afterExpression(engine));
    };
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

  buildStreamGetExpression(target, rescopeFuture, conversionMaybe) {
    const self = this;

    return (engine) => {
      const rescope = rescopeFuture === null ? null : rescopeFuture(engine);
      return engine.getStream(target, rescope, conversionMaybe);
    }
  }

  visitGetStream(ctx) {
    const self = this;
    return self.buildStreamGetExpression(ctx.target.text, null, null);
  }
  
  visitGetStreamIndirect(ctx) {
    const self = this;
    return self.buildStreamGetExpression(ctx.target.text, ctx.rescope.accept(self), null);
  }
  
  visitGetStreamConversion(ctx) {
    const self = this;
    return self.buildStreamGetExpression(ctx.target.text, null, ctx.conversion.accept(self));
  }
  
  visitGetStreamIndirectSubstanceAppUnits(ctx) {
    const self = this;
    return self.buildStreamGetExpression(
      ctx.target.text,
      ctx.rescope.accept(self),
      ctx.conversion.accept(self),
    );
  }

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

  visitParenExpression(ctx) {
    const self = this;
    return ctx.getChild(1).accept(self);
  }

  visitDrawNormalExpression(ctx) {
    const self = this;
    const meanFuture = ctx.mean.accept(self);
    const stdFuture = ctx.std.accept(self);

    return (engine) => {
      const meanValue = meanFuture(engine);
      const stdValue = stdFuture(engine);
      return d3.randomNormal(meanValue, stdValue);
    };
  }

  visitDrawUniformExpression(ctx) {
    const self = this;
    const lowFuture = ctx.low.accept(self);
    const highFuture = ctx.high.accept(self);

    return (engine) => {
      const lowValue = lowFuture(engine);
      const highValue = highFuture(engine);
      return d3.randomUniform(lowValue, highValue);
    };
  }

  visitSimpleIdentifier(ctx) {
    const self = this;
    const identifier = ctx.getChild(0).getText();

    return (engine) => {
      return engine.getVariable(identifier);
    };
  }

  buildDuring(minYearMaybe, maxYearMaybe) {
    const self = this;
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

  visitAboutStanza(ctx) {
    const self = this;
    if (ctx.getChildCount() > 0) {
      throw "About stanza should be empty except for comments.";
    }
    return {name: "about"}
  }

  visitDefaultStanza(ctx) {
    const self = this;
    const numApplications = ctx.getChildCount() - 4;
    
    const appChildren = [];
    for (let i = 0; i < numApplications; i++) {
      appChildren.push(ctx.getChild(i + 2));
    }

    const appCommands = appChildren.map((x) => x.accept(self));
    const execute = (engine) => {
      appCommands.forEach((command) => command(engine));
    };
    return {name: "default", executable: execute};
  }

  visitPolicyStanza(ctx) {
    const self = this;
    const policyName = self._getStringWithoutQuotes(ctx.name.text);
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
  
  visitSimulationsStanza(ctx) {
    const self = this;
    const numApplications = ctx.getChildCount() - 4;
    
    const appChildren = [];
    for (let i = 0; i < numApplications; i++) {
      appChildren.push(ctx.getChild(i + 2));
    }

    const simulations = appChildren.map((x) => x.accept(self));
    return {name: "simulations", "simulations": simulations};
  }

  buildDef(ctx, scopeSetter) {
    const self = this;
    const name = self._getStringWithoutQuotes(ctx.name.text);
    const numApplications = ctx.getChildCount() - 5;

    const appChildren = [];
    for (let i = 0; i < numApplications; i++) {
      appChildren.push(ctx.getChild(i + 3));
    }

    const appCommands = appChildren.map((x) => x.accept(self));
    const execute = (engine) => {
      scopeSetter(engine, name)
      appCommands.forEach((command) => command(engine));
    };
    return execute;
  }

  visitApplicationDef(ctx) {
    const self = this;
    return self.buildDef(ctx, (engine, name) => engine.setApplication(name));
  }
  
  visitSubstanceDef(ctx) {
    const self = this;
    return self.buildDef(ctx, (engine, name) => engine.setSubstance(name));
  }
  
  visitApplicationMod(ctx) {
    const self = this;
    return self.buildDef(ctx, (engine, name) => engine.setApplication(name));
  }
  
  visitSubstanceMod(ctx) {
    const self = this;
    return self.buildDef(ctx, (engine, name) => engine.setSubstance(name));
  }

  buildStreamMod(callback, ctx, durationFuture) {
    const self = this;
    const streamName = ctx.target.text;
    const valueFuture = ctx.value.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      const duration = durationFuture(engine);
      engine.cap(streamName, value, duration);
    };
  }

  buildCap(ctx, durationFuture) {
    const self = this;
    return self.buildStreamMod(
      (engine, stream, value, duration) => engine.cap(stream, value, duration),
      ctx,
      durationFuture,
    );
  }

  buildChange(ctx, durationFuture) {
    const self = this;
    return self.buildStreamMod(
      (engine, stream, value, duration) => engine.change(stream, value, duration),
      ctx,
      durationFuture,
    );
  }

  visitCapAllYears(ctx) {
    const self = this;
    return self.buildCap(ctx, (engine) => null);
  }
  
  visitCapDuration(ctx) {
    const self = this;
    const durationFuture = ctx.duration.accept(self);
    return self.buildCap(ctx, durationFuture);
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
    const identifier = ctx.target.text;
    const valueFuture = ctx.value.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      engine.defineVar(identifier);
      engine.setVariable(identifier, value);
    };
  }

  visitInitialChargeAllYears(ctx) {
    const self = this;
    const stream = ctx.target.text;
    const valueFuture = ctx.value.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      return engine.setInitialCharge(value, stream, null);
    };
  }
  
  visitInitialChargeDuration(ctx) {
    const self = this;
    const stream = ctx.target.text;
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
    }
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
    }
  }

  buildRecover(ctx, displacementFuture, durationFuture) {
    const self = this;
    const volumeFuture = ctx.volume.accept(self);
    const yieldFuture = ctx.volume.accept(self);

    return (engine) => {
      const volume = volumeFuture(engine);
      const yield = yieldFuture(engine);
      const displacement = displacementFuture(engine);
      const duration = durationFuture(engine);
      engine.recycle(volume, yield, displacement, duration);
    };
  }

  visitRecoverAllYears(ctx) {
    const self = this;
    return self.buildRecover(ctx, (engine) => null, (engine) => null);
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
    const stream = ctx.target.text;
    const destination = self._getStringWithoutQuotes(ctx.destination.text);

    return (engine) => {
      const volume = volumeFuture(engine);
      engine.replace(volume, stream, destination, null);
    };
  }
  
  visitReplaceDuration(ctx) {
    const self = this;
    const volumeFuture = ctx.volume.accept(self);
    const durationFuture = ctx.duration.accept(self);
    const stream = ctx.target.text;
    const destination = self._getStringWithoutQuotes(ctx.destination.text);

    return (engine) => {
      const volume = volumeFuture(engine);
      const duration = durationFuture(engine);
      engine.replace(volume, stream, destination, duration);
    };
  }

  visitRetireAllYears(ctx) {
    const self = this;
    const volumeFuture = ctx.volume.accept(self);

    return (engine) => {
      const volume = volumeFuture(engine);
      return engine.retire(volume, null);
    };
  }
  
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

  visitSetAllYears(ctx) {
    const self = this;
    const target = ctx.target.text;
    const valueFuture = ctx.value.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      engine.setStream(target, value, null);
    };
  }
  
  visitSetDuration(ctx) {
    const self = this;
    const target = ctx.target.text;
    const valueFuture = ctx.value.accept(self);
    const durationFuture = ctx.duration.accept(self);

    return (engine) => {
      const value = valueFuture(engine);
      const duration = durationFuture(engine);
      engine.setStream(target, value, duration);
    };
  }

  buildSimulate(ctx, stanzas, futureNumTrials) {
    const self = this;
    const name = ctx.name.text;
    const startFuture = ctx.start.accept(self);
    const endFuture = ctx.end.accept(self);

    return (engine) => {
      const start = startFuture(engine);
      const end = endFuture(engine);
      const numTrials = futureNumTrials(engine);
      return {name: name, stanzas: stanzas, trials: numTrials, start: start, end: end};
    };
  }

  visitBaseSimulation(ctx) {
    const self = this;
    return self.buildSimulate(ctx, ["default"], (x) => 1);
  }
  
  visitPolicySim(ctx) {
    const self = this;
    const numPolicies = Math.ceil((ctx.getChildCount() - 8) / 2);
    
    const policies = [];
    for (let i = 0; i < numPolicies; i++) {
      policies.push(ctx.getChild(i * 2 + 3).accept(self));
    }
    
    return self.buildSimulate(ctx, policies, (x) => 1);
  }
  
  visitBaseSimulationTrials(ctx) {
    const self = this;
    const futureNumTrials = ctx.trials.accept(self);
    return self.buildSimulate(ctx, ["default"], futureNumTrials);
  }
  
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
  
  visitProgram(ctx) {
    const self = this;

    const stanzasByName = new Map();
    const numStanzas = ctx.getChildCount();

    for(let i = 0; i < numStanzas; i++) {
      const newStanza = ctx.getChild(i).accept(self);
      stanzasByName.set(newStanza.name, newStanza);
    }

    if(!stanzasByName.has("simulations")) {
      return;
    }

    const simulationsStanza = stanzasByName.get("simulations");
    const simulationFutures = simulationsStanza["simulations"];
    
    const execute = () => {
      const simulations = simulationFutures.map((simulationFuture) => {
        const bootstrapEngine = new Engine(1, 1);
        return simulationFuture(bootstrapEngine);
      });
      const results = simulations.map((simulation) => {
        const runSimulation = () => {
          const engine = new Engine(simulation.start, simulation.end);
          const stanzas = simulation.stanzas;
          stanzas.forEach((stanzaName) => {
            const stanzaDetails = stanzasByName.get(stanzaName);
            const stanzaExecutable = stanzaDetails.executable;
            stanzaExecutable(engine);
          });
          return engine.getResults();
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

  _getStringWithoutQuotes(target) {
    const self = this;
    return target.substring(1, target.length - 1);
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


export { Compiler };
