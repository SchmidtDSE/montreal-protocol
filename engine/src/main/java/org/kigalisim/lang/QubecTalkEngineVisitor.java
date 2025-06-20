/**
 * Visitor for running QubecTalk code within the JVM.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.lang;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.lang.fragment.DuringFragment;
import org.kigalisim.lang.fragment.Fragment;
import org.kigalisim.lang.fragment.OperationFragment;
import org.kigalisim.lang.fragment.ProgramFragment;
import org.kigalisim.lang.fragment.SimulationFragment;
import org.kigalisim.lang.fragment.StanzaFragment;
import org.kigalisim.lang.fragment.UnitFragment;
import org.kigalisim.lang.operation.AdditionOperation;
import org.kigalisim.lang.operation.ChangeUnitsOperation;
import org.kigalisim.lang.operation.Operation;
import org.kigalisim.lang.operation.PreCalculatedOperation;
import org.kigalisim.lang.operation.SubtractionOperation;
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
  @Override
  public Fragment visitVolumeUnit(QubecTalkParser.VolumeUnitContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitRelativeUnit(QubecTalkParser.RelativeUnitContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitTemporalUnit(QubecTalkParser.TemporalUnitContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitUnitValue(QubecTalkParser.UnitValueContext ctx) {
    Operation futureCalculation = visit(ctx.expression()).getOperation();
    String unit = visit(ctx.unitOrRatio()).getUnit();
    Operation operation = new ChangeUnitsOperation(futureCalculation, unit);
    return new OperationFragment(operation);
  }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitUnitOrRatio(QubecTalkParser.UnitOrRatioContext ctx) {
    String unitText = ctx.getText();
    return new UnitFragment(unitText);
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
  @Override public Fragment visitAdditionExpression(QubecTalkParser.AdditionExpressionContext ctx) {
    Fragment leftFragment = visit(ctx.expression(0));
    Fragment rightFragment = visit(ctx.expression(1));

    Operation leftCalculation = leftFragment.getOperation();
    Operation rightCalculation = rightFragment.getOperation();

    String operator = ctx.op.getText();
    Operation calculation;

    if (operator.equals("+")) {
      calculation = new AdditionOperation(leftCalculation, rightCalculation);
    } else if (operator.equals("-")) {
      calculation = new SubtractionOperation(leftCalculation, rightCalculation);
    } else {
      throw new IllegalStateException("Unexpected operator: " + operator);
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
  public Fragment visitSimpleExpression(QubecTalkParser.SimpleExpressionContext ctx) {
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
  public Fragment visitParenExpression(QubecTalkParser.ParenExpressionContext ctx) {
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
  @Override public Fragment visitDuringSingleYear(QubecTalkParser.DuringSingleYearContext ctx) {
    // Get the target expression (the year)
    Fragment targetFragment = visit(ctx.target);
    Operation targetOperation = targetFragment.getOperation();

    // Create a CalculatedTimePointFuture for both start and end (same year)
    TimePointFuture startPoint = new CalculatedTimePointFuture(targetOperation);
    TimePointFuture endPoint = new CalculatedTimePointFuture(targetOperation);

    // Create a ParsedDuring with the same year for both start and end
    ParsedDuring during = new ParsedDuring(
        Optional.of(startPoint),
        Optional.of(endPoint)
    );

    return new DuringFragment(during);
  }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDuringStart(QubecTalkParser.DuringStartContext ctx) {
    // Create a DynamicCapFuture with the "beginning" dynamic cap for the start
    TimePointFuture startPoint = new DynamicCapFuture("beginning");

    // Create a ParsedDuring with a start point but no end point (unbounded)
    ParsedDuring during = new ParsedDuring(
        Optional.of(startPoint),
        Optional.empty()
    );

    return new DuringFragment(during);
  }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDuringRange(QubecTalkParser.DuringRangeContext ctx) {
    // Get the lower and upper expressions
    Fragment lowerFragment = visit(ctx.lower);
    Fragment upperFragment = visit(ctx.upper);
    Operation lowerOperation = lowerFragment.getOperation();
    Operation upperOperation = upperFragment.getOperation();

    // Create CalculatedTimePointFuture objects for both start and end
    TimePointFuture startPoint = new CalculatedTimePointFuture(lowerOperation);
    TimePointFuture endPoint = new CalculatedTimePointFuture(upperOperation);

    // Create a ParsedDuring with both start and end points
    ParsedDuring during = new ParsedDuring(
        Optional.of(startPoint),
        Optional.of(endPoint)
    );

    return new DuringFragment(during);
  }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDuringWithMin(QubecTalkParser.DuringWithMinContext ctx) {
    // Get the lower expression
    Fragment lowerFragment = visit(ctx.lower);
    Operation lowerOperation = lowerFragment.getOperation();

    // Create a CalculatedTimePointFuture for the start
    TimePointFuture startPoint = new CalculatedTimePointFuture(lowerOperation);

    // Create a DynamicCapFuture with the "onwards" dynamic cap for the end
    TimePointFuture endPoint = new DynamicCapFuture("onwards");

    // Create a ParsedDuring with a start point and an "onwards" end point
    ParsedDuring during = new ParsedDuring(
        Optional.of(startPoint),
        Optional.of(endPoint)
    );

    return new DuringFragment(during);
  }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDuringWithMax(QubecTalkParser.DuringWithMaxContext ctx) {
    // Get the upper expression
    Fragment upperFragment = visit(ctx.upper);
    Operation upperOperation = upperFragment.getOperation();

    // Create a DynamicCapFuture with the "beginning" dynamic cap for the start
    TimePointFuture startPoint = new DynamicCapFuture("beginning");

    // Create a CalculatedTimePointFuture for the end
    TimePointFuture endPoint = new CalculatedTimePointFuture(upperOperation);

    // Create a ParsedDuring with a "beginning" start point and an end point
    ParsedDuring during = new ParsedDuring(
        Optional.of(startPoint),
        Optional.of(endPoint)
    );

    return new DuringFragment(during);
  }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDuringAll(QubecTalkParser.DuringAllContext ctx) {
    // Create a DynamicCapFuture with the "beginning" dynamic cap for the start
    TimePointFuture startPoint = new DynamicCapFuture("beginning");

    // Create a DynamicCapFuture with the "onwards" dynamic cap for the end
    TimePointFuture endPoint = new DynamicCapFuture("onwards");

    // Create a ParsedDuring with a "beginning" start point and an "onwards" end point
    ParsedDuring during = new ParsedDuring(
        Optional.of(startPoint),
        Optional.of(endPoint)
    );

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
    List<Fragment> commands = new ArrayList<>();
    
    // Visit each child command in the default stanza
    for (int i = 2; i < ctx.getChildCount() - 2; i++) { // Skip "start default" and "end default"
      Fragment child = visit(ctx.getChild(i));
      if (child != null) {
        commands.add(child);
      }
    }
    
    return new StanzaFragment("default", commands, null);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitPolicyStanza(QubecTalkParser.PolicyStanzaContext ctx) {
    return visitChildren(ctx);
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public Fragment visitSimulationsStanza(QubecTalkParser.SimulationsStanzaContext ctx) {
    List<SimulationFragment> simulations = new ArrayList<>();
    
    // Visit each simulation definition in the simulations stanza
    for (int i = 2; i < ctx.getChildCount() - 2; i++) { // Skip "start simulations" and "end simulations"
      Fragment child = visit(ctx.getChild(i));
      if (child instanceof SimulationFragment) {
        simulations.add((SimulationFragment) child);
      }
    }
    
    return new StanzaFragment("simulations", new ArrayList<>(), simulations);
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
    String name = removeQuotes(ctx.name.getText());
    int startYear = Integer.parseInt(ctx.start.getText());
    int endYear = Integer.parseInt(ctx.end.getText());
    
    // For base simulation, use only the default scenario
    List<String> scenarios = Arrays.asList("default");
    
    return new SimulationFragment(name, startYear, endYear, scenarios);
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
    List<StanzaFragment> stanzas = new ArrayList<>();
    
    // Visit each stanza in the program
    for (int i = 0; i < ctx.getChildCount(); i++) {
      Fragment child = visit(ctx.getChild(i));
      if (child instanceof StanzaFragment) {
        stanzas.add((StanzaFragment) child);
      }
    }
    
    return new ProgramFragment(stanzas);
  }

  /**
   * Helper method to remove quotes from string literals.
   */
  private String removeQuotes(String text) {
    if (text.startsWith("\"") && text.endsWith("\"")) {
      return text.substring(1, text.length() - 1);
    }
    return text;
  }
}
