/**
 * Visitor for running QubecTalk code within the JVM.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.lang;

import java.math.BigDecimal;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.lang.fragment.OperationFragment;
import org.kigalisim.lang.fragment.Fragment;
import org.kigalisim.lang.fragment.UnitFragment;
import org.kigalisim.lang.operation.AdditionOperation;
import org.kigalisim.lang.operation.ChangeUnitsOperation;
import org.kigalisim.lang.operation.Operation;
import org.kigalisim.lang.operation.PreCalculatedOperation;
import org.kigalisim.lang.operation.SubtractionOperation;


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
  @Override public Fragment visitString(QubecTalkParser.StringContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitVolumeUnit(QubecTalkParser.VolumeUnitContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitRelativeUnit(QubecTalkParser.RelativeUnitContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitTemporalUnit(QubecTalkParser.TemporalUnitContext ctx) { return visitChildren(ctx); }

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
  @Override public Fragment visitConditionExpression(QubecTalkParser.ConditionExpressionContext ctx) { return visitChildren(ctx); }

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
  @Override public Fragment visitPowExpression(QubecTalkParser.PowExpressionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitConditionalExpression(QubecTalkParser.ConditionalExpressionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitGetStreamConversion(QubecTalkParser.GetStreamConversionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitLimitMinExpression(QubecTalkParser.LimitMinExpressionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitSimpleExpression(QubecTalkParser.SimpleExpressionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitGetStreamIndirectConversion(QubecTalkParser.GetStreamIndirectConversionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitParenExpression(QubecTalkParser.ParenExpressionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitLimitMaxExpression(QubecTalkParser.LimitMaxExpressionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitMultiplyExpression(QubecTalkParser.MultiplyExpressionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDrawNormalExpression(QubecTalkParser.DrawNormalExpressionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitLogicalExpression(QubecTalkParser.LogicalExpressionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitGetStreamIndirect(QubecTalkParser.GetStreamIndirectContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDrawUniformExpression(QubecTalkParser.DrawUniformExpressionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitSimpleIdentifier(QubecTalkParser.SimpleIdentifierContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitGetStream(QubecTalkParser.GetStreamContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitLimitBoundExpression(QubecTalkParser.LimitBoundExpressionContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitStream(QubecTalkParser.StreamContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitIdentifierAsVar(QubecTalkParser.IdentifierAsVarContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDuringSingleYear(QubecTalkParser.DuringSingleYearContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDuringStart(QubecTalkParser.DuringStartContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDuringRange(QubecTalkParser.DuringRangeContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDuringWithMin(QubecTalkParser.DuringWithMinContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDuringWithMax(QubecTalkParser.DuringWithMaxContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDuringAll(QubecTalkParser.DuringAllContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitAboutStanza(QubecTalkParser.AboutStanzaContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDefaultStanza(QubecTalkParser.DefaultStanzaContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitPolicyStanza(QubecTalkParser.PolicyStanzaContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitSimulationsStanza(QubecTalkParser.SimulationsStanzaContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitApplicationDef(QubecTalkParser.ApplicationDefContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitSubstanceDef(QubecTalkParser.SubstanceDefContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitApplicationMod(QubecTalkParser.ApplicationModContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitSubstanceMod(QubecTalkParser.SubstanceModContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitLimitCommandAllYears(QubecTalkParser.LimitCommandAllYearsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitLimitCommandDisplacingAllYears(QubecTalkParser.LimitCommandDisplacingAllYearsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitLimitCommandDuration(QubecTalkParser.LimitCommandDurationContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitLimitCommandDisplacingDuration(QubecTalkParser.LimitCommandDisplacingDurationContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitChangeAllYears(QubecTalkParser.ChangeAllYearsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitChangeDuration(QubecTalkParser.ChangeDurationContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitDefineVarStatement(QubecTalkParser.DefineVarStatementContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitEqualsAllYears(QubecTalkParser.EqualsAllYearsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitEqualsDuration(QubecTalkParser.EqualsDurationContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitInitialChargeAllYears(QubecTalkParser.InitialChargeAllYearsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitInitialChargeDuration(QubecTalkParser.InitialChargeDurationContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitRechargeAllYears(QubecTalkParser.RechargeAllYearsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitRechargeDuration(QubecTalkParser.RechargeDurationContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitRecoverAllYears(QubecTalkParser.RecoverAllYearsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitRecoverDuration(QubecTalkParser.RecoverDurationContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitRecoverDisplacementAllYears(QubecTalkParser.RecoverDisplacementAllYearsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitRecoverDisplacementDuration(QubecTalkParser.RecoverDisplacementDurationContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitReplaceAllYears(QubecTalkParser.ReplaceAllYearsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitReplaceDuration(QubecTalkParser.ReplaceDurationContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitRetireAllYears(QubecTalkParser.RetireAllYearsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitRetireDuration(QubecTalkParser.RetireDurationContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitSetAllYears(QubecTalkParser.SetAllYearsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitSetDuration(QubecTalkParser.SetDurationContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitBaseSimulation(QubecTalkParser.BaseSimulationContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitPolicySim(QubecTalkParser.PolicySimContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitBaseSimulationTrials(QubecTalkParser.BaseSimulationTrialsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitPolicySimTrials(QubecTalkParser.PolicySimTrialsContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitGlobalStatement(QubecTalkParser.GlobalStatementContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitSubstanceStatement(QubecTalkParser.SubstanceStatementContext ctx) { return visitChildren(ctx); }

  /**
   * {@inheritDoc}
   */
  @Override public Fragment visitProgram(QubecTalkParser.ProgramContext ctx) { return visitChildren(ctx); }
}
