/**
 * Strategy for recalculating population changes.
 *
 * <p>This strategy encapsulates the logic previously found in the
 * recalcPopulationChange method of SingleThreadEngine.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.engine.number.UnitConverter;
import org.kigalisim.engine.state.OverridingConverterStateGetter;
import org.kigalisim.engine.state.Scope;

/**
 * Strategy for recalculating population changes.
 */
public class PopulationChangeRecalcStrategy implements RecalcStrategy {

  private Scope scope;
  private Boolean subtractRecharge;

  /**
   * Create a new PopulationChangeRecalcStrategy.
   *
   * @param scope The scope to use for calculations, null to use engine's current scope
   * @param subtractRecharge Whether to subtract recharge, null to default to true
   */
  public PopulationChangeRecalcStrategy(Scope scope, Boolean subtractRecharge) {
    this.scope = scope;
    this.subtractRecharge = subtractRecharge;
  }

  @Override
  public void execute(Engine target) {
    if (!(target instanceof SingleThreadEngine)) {
      throw new IllegalArgumentException(
          "PopulationChangeRecalcStrategy requires a SingleThreadEngine");
    }

    SingleThreadEngine engine = (SingleThreadEngine) target;
    
    // Move the logic from SingleThreadEngine.recalcPopulationChange
    OverridingConverterStateGetter stateGetter =
        new OverridingConverterStateGetter(engine.getStateGetter());
    UnitConverter unitConverter = new UnitConverter(stateGetter);
    Scope scopeEffective = scope != null ? scope : engine.getScope();
    boolean subtractRechargeEffective = subtractRecharge != null ? subtractRecharge : true;
    String application = scopeEffective.getApplication();
    String substance = scopeEffective.getSubstance();

    if (application == null || substance == null) {
      engine.raiseNoAppOrSubstance("recalculating population change", "");
    }

    // Get prior population
    EngineNumber priorPopulationRaw = engine.getStream("priorEquipment", scopeEffective, null);
    EngineNumber priorPopulation = unitConverter.convert(priorPopulationRaw, "units");
    stateGetter.setPopulation(priorPopulation);

    // Get substance sales
    EngineNumber substanceSalesRaw = engine.getStream("sales", scopeEffective, null);
    EngineNumber substanceSales = unitConverter.convert(substanceSalesRaw, "kg");

    // Get recharge volume
    EngineNumber rechargeVolume = engine.calculateRechargeVolume();

    // Get total volume available for new units
    BigDecimal salesKg = substanceSales.getValue();
    BigDecimal rechargeKg = subtractRechargeEffective ? rechargeVolume.getValue() : BigDecimal.ZERO;
    BigDecimal availableForNewUnitsKg = salesKg.subtract(rechargeKg);

    // Convert to unit delta
    EngineNumber initialChargeRaw = engine.getInitialCharge("sales");
    EngineNumber initialCharge = unitConverter.convert(initialChargeRaw, "kg / unit");
    BigDecimal initialChargeKgUnit = initialCharge.getValue();
    BigDecimal deltaUnitsRaw = divideWithZero(availableForNewUnitsKg, initialChargeKgUnit);
    BigDecimal deltaUnits = deltaUnitsRaw;
    EngineNumber newUnitsMarginal = new EngineNumber(
        deltaUnits.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : deltaUnits, "units");

    // Find new total
    BigDecimal priorPopulationUnits = priorPopulation.getValue();
    BigDecimal newUnits = priorPopulationUnits.add(deltaUnits);
    boolean newUnitsNegative = newUnits.compareTo(BigDecimal.ZERO) < 0;
    BigDecimal newUnitsAllowed = newUnitsNegative ? BigDecimal.ZERO : newUnits;
    EngineNumber newUnitsEffective = new EngineNumber(newUnitsAllowed, "units");

    // Save
    engine.setStream("equipment", newUnitsEffective, null, scopeEffective, false, null);
    engine.setStream("newEquipment", newUnitsMarginal, null, scopeEffective, false, null);

    // Recalc recharge emissions
    engine.recalcRechargeEmissions(scopeEffective);
  }

  /**
   * Divide with a check for division by zero.
   *
   * @param numerator The numerator to use in the operation.
   * @param denominator The numerator to use in the operation.
   * @return Zero if denominator is zero, otherwise the result of regular division.
   */
  private BigDecimal divideWithZero(BigDecimal numerator, BigDecimal denominator) {
    boolean denominatorIsZero = denominator.compareTo(BigDecimal.ZERO) == 0;
    if (denominatorIsZero) {
      return BigDecimal.ZERO;
    } else {
      return numerator.divide(denominator, 10, RoundingMode.HALF_UP);
    }
  }
}