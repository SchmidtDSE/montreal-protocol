/**
 * Strategy for recalculating sales.
 *
 * <p>This strategy encapsulates the logic previously found in the
 * recalcSales method of SingleThreadEngine.</p>
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
import org.kigalisim.engine.state.StreamKeeper;

/**
 * Strategy for recalculating sales.
 */
public class SalesRecalcStrategy implements RecalcStrategy {

  private Scope scope;

  /**
   * Create a new SalesRecalcStrategy.
   *
   * @param scope The scope to use for calculations, null to use engine's current scope
   */
  public SalesRecalcStrategy(Scope scope) {
    this.scope = scope;
  }

  @Override
  public void execute(Engine target) {
    if (!(target instanceof SingleThreadEngine)) {
      throw new IllegalArgumentException(
          "SalesRecalcStrategy requires a SingleThreadEngine");
    }

    SingleThreadEngine engine = (SingleThreadEngine) target;

    // Move the logic from SingleThreadEngine.recalcSales
    Scope scopeEffective = scope != null ? scope : engine.getScope();

    OverridingConverterStateGetter stateGetter =
        new OverridingConverterStateGetter(engine.getStateGetter());
    UnitConverter unitConverter = new UnitConverter(stateGetter);
    String application = scopeEffective.getApplication();
    String substance = scopeEffective.getSubstance();

    if (application == null || substance == null) {
      engine.raiseNoAppOrSubstance("recalculating sales", "");
    }

    StreamKeeper streamKeeper = engine.getStreamKeeper();

    // Get recharge population
    EngineNumber basePopulation = engine.getStream("priorEquipment", scopeEffective, null);
    stateGetter.setPopulation(basePopulation);
    EngineNumber rechargePopRaw = streamKeeper.getRechargePopulation(
        application,
        substance
    );
    EngineNumber rechargePop = unitConverter.convert(rechargePopRaw, "units");
    stateGetter.clearPopulation();

    // Switch into recharge population
    stateGetter.setPopulation(rechargePop);

    // Get recharge amount
    EngineNumber rechargeIntensityRaw = streamKeeper.getRechargeIntensity(
        application,
        substance
    );
    EngineNumber rechargeVolume = unitConverter.convert(rechargeIntensityRaw, "kg");

    // Determine initial charge
    EngineNumber initialChargeRaw = engine.getInitialCharge("sales");
    EngineNumber initialCharge = unitConverter.convert(initialChargeRaw, "kg / unit");

    // Get recycling volume
    stateGetter.setVolume(rechargeVolume);
    EngineNumber recoveryVolumeRaw = streamKeeper.getRecoveryRate(application, substance);
    EngineNumber recoveryVolume = unitConverter.convert(recoveryVolumeRaw, "kg");
    stateGetter.clearVolume();

    // Get recycling amount
    stateGetter.setVolume(recoveryVolume);
    EngineNumber recycledVolumeRaw = streamKeeper.getYieldRate(application, substance);
    EngineNumber recycledVolume = unitConverter.convert(recycledVolumeRaw, "kg");
    stateGetter.clearVolume();

    // Get recycling displaced
    BigDecimal recycledKg = recycledVolume.getValue();

    EngineNumber displacementRateRaw = streamKeeper.getDisplacementRate(
        application,
        substance
    );
    EngineNumber displacementRate = unitConverter.convert(displacementRateRaw, "%");
    BigDecimal displacementRateRatio = displacementRate.getValue().divide(BigDecimal.valueOf(100));
    final BigDecimal recycledDisplacedKg = recycledKg.multiply(displacementRateRatio);

    // Switch out of recharge population
    stateGetter.clearPopulation();

    // Determine needs for new equipment deployment
    stateGetter.setAmortizedUnitVolume(initialCharge);
    EngineNumber populationChangeRaw = stateGetter.getPopulationChange(engine.getUnitConverter());
    EngineNumber populationChange = unitConverter.convert(populationChangeRaw, "units");
    EngineNumber volumeForNew = unitConverter.convert(populationChange, "kg");

    // Get prior population
    EngineNumber priorPopulationRaw = engine.getStream("priorEquipment", scopeEffective, null);
    EngineNumber priorPopulation = unitConverter.convert(priorPopulationRaw, "units");
    stateGetter.setPopulation(priorPopulation);

    // Determine sales prior to recycling
    final BigDecimal kgForRecharge = rechargeVolume.getValue();
    final BigDecimal kgForNew = volumeForNew.getValue();

    // Return to original initial charge
    stateGetter.clearAmortizedUnitVolume();

    // Return original
    stateGetter.clearVolume();

    // Determine how much to offset domestic and imports
    EngineNumber manufactureRaw = engine.getStream("manufacture", scopeEffective, null);
    EngineNumber importRaw = engine.getStream("import", scopeEffective, null);
    EngineNumber priorRecycleRaw = engine.getStream("recycle", scopeEffective, null);

    EngineNumber manufactureSalesConverted = unitConverter.convert(manufactureRaw, "kg");
    EngineNumber importSalesConverted = unitConverter.convert(importRaw, "kg");
    EngineNumber priorRecycleSalesConverted = unitConverter.convert(priorRecycleRaw, "kg");

    BigDecimal manufactureSalesKg = manufactureSalesConverted.getValue();
    BigDecimal importSalesKg = importSalesConverted.getValue();
    BigDecimal priorRecycleSalesKg = priorRecycleSalesConverted.getValue();
    BigDecimal totalNonRecycleKg = manufactureSalesKg.add(importSalesKg);

    // Get stream percentages for allocation
    BigDecimal percentManufacture;
    BigDecimal percentImport;

    if (totalNonRecycleKg.compareTo(BigDecimal.ZERO) == 0) {
      EngineNumber manufactureInitialCharge = engine.getInitialCharge("manufacture");
      EngineNumber importInitialCharge = engine.getInitialCharge("import");
      BigDecimal manufactureInitialChargeVal = manufactureInitialCharge.getValue();
      BigDecimal importInitialChargeVal = unitConverter
          .convert(importInitialCharge, manufactureInitialCharge.getUnits()).getValue();
      BigDecimal totalInitialChargeVal = manufactureInitialChargeVal.add(importInitialChargeVal);

      if (totalInitialChargeVal.compareTo(BigDecimal.ZERO) == 0) {
        percentManufacture = BigDecimal.ONE;
        percentImport = BigDecimal.ZERO;
      } else {
        percentManufacture = divideWithZero(manufactureInitialChargeVal, totalInitialChargeVal);
        percentImport = divideWithZero(importInitialChargeVal, totalInitialChargeVal);
      }
    } else {
      percentManufacture = divideWithZero(manufactureSalesKg, totalNonRecycleKg);
      percentImport = divideWithZero(importSalesKg, totalNonRecycleKg);
    }

    // Recycle
    EngineNumber newRecycleValue = new EngineNumber(recycledDisplacedKg, "kg");
    streamKeeper.setStream(application, substance, "recycle", newRecycleValue);

    // New values
    BigDecimal requiredKgUnbound = kgForRecharge.add(kgForNew);
    boolean requiredKgNegative = requiredKgUnbound.compareTo(BigDecimal.ZERO) < 0;
    BigDecimal requiredKg = requiredKgNegative ? BigDecimal.ZERO : requiredKgUnbound;
    BigDecimal newManufactureKg = percentManufacture.multiply(requiredKg);
    BigDecimal newImportKg = percentImport.multiply(requiredKg);
    EngineNumber newManufacture = new EngineNumber(newManufactureKg, "kg");
    EngineNumber newImport = new EngineNumber(newImportKg, "kg");
    streamKeeper.setStream(application, substance, "manufacture", newManufacture);
    streamKeeper.setStream(application, substance, "import", newImport);
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
