/**
 * Visitor for running QubecTalk code within the JVM.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.lang;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.lang.fragment.DuringFragment;
import org.kigalisim.lang.fragment.Fragment;
import org.kigalisim.lang.fragment.OperationFragment;
import org.kigalisim.lang.fragment.PolicyFragment;
import org.kigalisim.lang.fragment.ProgramFragment;
import org.kigalisim.lang.fragment.ScenariosFragment;
import org.kigalisim.lang.fragment.UnitFragment;
import org.kigalisim.lang.operation.AdditionOperation;
import org.kigalisim.lang.operation.ChangeUnitsOperation;
import org.kigalisim.lang.operation.Operation;
import org.kigalisim.lang.operation.PreCalculatedOperation;
import org.kigalisim.lang.operation.SubtractionOperation;
import org.kigalisim.lang.program.ParsedPolicy;
import org.kigalisim.lang.program.ParsedProgram;
import org.kigalisim.lang.program.ParsedScenario;
import org.kigalisim.lang.program.ParsedScenarios;
import org.kigalisim.lang.time.CalculatedTimePointFuture;
import org.kigalisim.lang.time.DynamicCapFuture;
import org.kigalisim.lang.time.ParsedDuring;
import org.kigalisim.lang.time.TimePointFuture;


/**
 * Visitor which interprets QubecTalk parsed code into Commands through Fragments.
 *
 * <p>Visitor which takes the parse tree of a QubecTalk program and converts it to a series of
 * Fragments which are used to build up Commands which actually execute operations against a
 * Kigali Sim Engine.</p>
 */
@SuppressWarnings("CheckReturnValue")
public class QubecTalkEngineVisitor extends QubecTalkBaseVisitor<Fragment> {

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitNumber(QubecTalkParser.NumberContext ctx) {
    String rawText = ctx.getText();
    BigDecimal numberRaw = new BigDecimal(rawText);
    EngineNumber number = new EngineNumber(numberRaw, "");
    Operation calculation = new PreCalculatedOperation(number);
    return new OperationFragment(calculation);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitString(QubecTalkParser.StringContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitUnitValue(QubecTalkParser.UnitValueContext ctx) {
    Operation futureCalculation = visit(ctx.expression()).getOperation();
    String unit = visit(ctx.unitOrRatio()).getUnit();
    Operation calculation = new ChangeUnitsOperation(futureCalculation, unit);
    return new OperationFragment(calculation);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitUnitOrRatio(QubecTalkParser.UnitOrRatioContext ctx) {
    String unit = ctx.getText();
    return new UnitFragment(unit.replaceAll(" each ", " / "));
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitConditionExpression(QubecTalkParser.ConditionExpressionContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitAdditionExpression(QubecTalkParser.AdditionExpressionContext ctx) {
    Operation left = visit(ctx.expression(0)).getOperation();
    Operation right = visit(ctx.expression(1)).getOperation();

    String operatorStr = ctx.op.getText();
    Operation calculation;
    if (operatorStr.equals("+")) {
      calculation = new AdditionOperation(left, right);
    } else if (operatorStr.equals("-")) {
      calculation = new SubtractionOperation(left, right);
    } else {
      throw new RuntimeException("Unknown addition operation");
    }
    return new OperationFragment(calculation);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitPowExpression(QubecTalkParser.PowExpressionContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitConditionalExpression(QubecTalkParser.ConditionalExpressionContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitGetStreamConversion(QubecTalkParser.GetStreamConversionContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitLimitMinExpression(QubecTalkParser.LimitMinExpressionContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitGetStreamIndirectConversion(
      QubecTalkParser.GetStreamIndirectConversionContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitLimitMaxExpression(QubecTalkParser.LimitMaxExpressionContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitMultiplyExpression(QubecTalkParser.MultiplyExpressionContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitDrawNormalExpression(QubecTalkParser.DrawNormalExpressionContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitLogicalExpression(QubecTalkParser.LogicalExpressionContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitGetStreamIndirect(QubecTalkParser.GetStreamIndirectContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitDrawUniformExpression(QubecTalkParser.DrawUniformExpressionContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitSimpleIdentifier(QubecTalkParser.SimpleIdentifierContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitGetStream(QubecTalkParser.GetStreamContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitLimitBoundExpression(QubecTalkParser.LimitBoundExpressionContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitStream(QubecTalkParser.StreamContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitIdentifierAsVar(QubecTalkParser.IdentifierAsVarContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitDuringRange(QubecTalkParser.DuringRangeContext ctx) {
    TimePointFuture start = new CalculatedTimePointFuture(visit(ctx.expression(0)).getOperation());
    TimePointFuture end = new CalculatedTimePointFuture(visit(ctx.expression(1)).getOperation());
    ParsedDuring during = new ParsedDuring(Optional.of(start), Optional.of(end));
    return new DuringFragment(during);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitDuringStart(QubecTalkParser.DuringStartContext ctx) {
    TimePointFuture start = new DynamicCapFuture("beginning");
    ParsedDuring during = new ParsedDuring(Optional.of(start), Optional.of(start));
    return new DuringFragment(during);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitDuringSingleYear(QubecTalkParser.DuringSingleYearContext ctx) {
    TimePointFuture point = new CalculatedTimePointFuture(visit(ctx.expression()).getOperation());
    ParsedDuring during = new ParsedDuring(Optional.of(point), Optional.of(point));
    return new DuringFragment(during);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitDuringAll(QubecTalkParser.DuringAllContext ctx) {
    TimePointFuture start = new DynamicCapFuture("beginning");
    TimePointFuture end = new DynamicCapFuture("onwards");
    ParsedDuring during = new ParsedDuring(Optional.of(start), Optional.of(end));
    return new DuringFragment(during);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitDuringWithMax(QubecTalkParser.DuringWithMaxContext ctx) {
    TimePointFuture start = new DynamicCapFuture("beginning");
    TimePointFuture end = new CalculatedTimePointFuture(visit(ctx.expression()).getOperation());
    ParsedDuring during = new ParsedDuring(Optional.of(start), Optional.of(end));
    return new DuringFragment(during);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitDuringWithMin(QubecTalkParser.DuringWithMinContext ctx) {
    TimePointFuture start = new CalculatedTimePointFuture(visit(ctx.expression()).getOperation());
    TimePointFuture end = new DynamicCapFuture("onwards");
    ParsedDuring during = new ParsedDuring(Optional.of(start), Optional.of(end));
    return new DuringFragment(during);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitAboutStanza(QubecTalkParser.AboutStanzaContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitDefaultStanza(QubecTalkParser.DefaultStanzaContext ctx) {
    List<org.kigalisim.lang.program.ParsedApplication> applications = new ArrayList<>();

    for (QubecTalkParser.ApplicationDefContext appCtx : ctx.applicationDef()) {
      Fragment appFragment = visit(appCtx);
      try {
        applications.add(appFragment.getApplication());
      } catch (RuntimeException e) {
        // Not an application, ignore
      }
    }

    ParsedPolicy policy = new ParsedPolicy("default", applications);
    return new PolicyFragment(policy);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitSimulationsStanza(QubecTalkParser.SimulationsStanzaContext ctx) {
    List<ParsedScenario> scenarios = new ArrayList<>();

    // Process each simulation
    for (int i = 0; i < ctx.getChildCount(); i++) {
      if (ctx.getChild(i) instanceof QubecTalkParser.SimulateContext) {
        QubecTalkParser.SimulateContext simCtx = (QubecTalkParser.SimulateContext) ctx.getChild(i);
        Fragment simFragment = visit(simCtx);
        try {
          scenarios.add(simFragment.getScenario());
        } catch (RuntimeException e) {
          // Not a scenario, ignore
        }
      }
    }

    ParsedScenarios parsedScenarios = new ParsedScenarios(scenarios);
    return new ScenariosFragment(parsedScenarios);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitPolicyStanza(QubecTalkParser.PolicyStanzaContext ctx) {
    List<org.kigalisim.lang.program.ParsedApplication> applications = new ArrayList<>();

    // Get the policy name
    String policyName = visit(ctx.name).getUnit();

    for (QubecTalkParser.ApplicationModContext appCtx : ctx.applicationMod()) {
      Fragment appFragment = visit(appCtx);
      try {
        applications.add(appFragment.getApplication());
      } catch (RuntimeException e) {
        // Not an application, ignore
      }
    }

    ParsedPolicy policy = new ParsedPolicy(policyName, applications);
    return new PolicyFragment(policy);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitApplicationDef(QubecTalkParser.ApplicationDefContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitSubstanceDef(QubecTalkParser.SubstanceDefContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitApplicationMod(QubecTalkParser.ApplicationModContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitSubstanceMod(QubecTalkParser.SubstanceModContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitLimitCommandAllYears(QubecTalkParser.LimitCommandAllYearsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitLimitCommandDisplacingAllYears(
      QubecTalkParser.LimitCommandDisplacingAllYearsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitLimitCommandDuration(QubecTalkParser.LimitCommandDurationContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitLimitCommandDisplacingDuration(
      QubecTalkParser.LimitCommandDisplacingDurationContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitChangeAllYears(QubecTalkParser.ChangeAllYearsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitChangeDuration(QubecTalkParser.ChangeDurationContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitDefineVarStatement(QubecTalkParser.DefineVarStatementContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitEqualsAllYears(QubecTalkParser.EqualsAllYearsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitEqualsDuration(QubecTalkParser.EqualsDurationContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitInitialChargeAllYears(QubecTalkParser.InitialChargeAllYearsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitInitialChargeDuration(QubecTalkParser.InitialChargeDurationContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitRechargeAllYears(QubecTalkParser.RechargeAllYearsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitRechargeDuration(QubecTalkParser.RechargeDurationContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitRecoverAllYears(QubecTalkParser.RecoverAllYearsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitRecoverDuration(QubecTalkParser.RecoverDurationContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitRecoverDisplacementAllYears(
      QubecTalkParser.RecoverDisplacementAllYearsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitRecoverDisplacementDuration(
      QubecTalkParser.RecoverDisplacementDurationContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitReplaceAllYears(QubecTalkParser.ReplaceAllYearsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitReplaceDuration(QubecTalkParser.ReplaceDurationContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitRetireAllYears(QubecTalkParser.RetireAllYearsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitRetireDuration(QubecTalkParser.RetireDurationContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitSetAllYears(QubecTalkParser.SetAllYearsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitSetDuration(QubecTalkParser.SetDurationContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitBaseSimulation(QubecTalkParser.BaseSimulationContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitPolicySim(QubecTalkParser.PolicySimContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitBaseSimulationTrials(QubecTalkParser.BaseSimulationTrialsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitPolicySimTrials(QubecTalkParser.PolicySimTrialsContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitGlobalStatement(QubecTalkParser.GlobalStatementContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitSubstanceStatement(QubecTalkParser.SubstanceStatementContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitProgram(QubecTalkParser.ProgramContext ctx) {
    List<ParsedPolicy> policies = new ArrayList<>();
    List<ParsedScenario> scenarios = new ArrayList<>();

    for (QubecTalkParser.StanzaContext stanzaCtx : ctx.stanza()) {
      Fragment stanzaFragment = visit(stanzaCtx);

      if (stanzaFragment.getIsStanzaScenarios()) {
        // This is a scenarios stanza
        ScenariosFragment scenariosFragment = (ScenariosFragment) stanzaFragment;
        ParsedScenarios parsedScenarios = scenariosFragment.getScenarios();
        for (String scenarioName : parsedScenarios.getScenarios()) {
          scenarios.add(parsedScenarios.getScenario(scenarioName));
        }
      } else {
        try {
          // Try to get a policy from the stanza
          policies.add(stanzaFragment.getPolicy());
        } catch (RuntimeException e) {
          // Not a policy stanza, ignore
        }
      }
    }

    ParsedProgram program = new ParsedProgram(policies, scenarios);
    return new ProgramFragment(program);
  }
}
