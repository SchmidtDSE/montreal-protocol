/**
 * Strategy for recalculating retirement.
 *
 * <p>This strategy encapsulates the logic previously found in the
 * recalcRetire method of SingleThreadEngine.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import java.math.BigDecimal;
import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.engine.number.UnitConverter;
import org.kigalisim.engine.state.OverridingConverterStateGetter;
import org.kigalisim.engine.state.Scope;

/**
 * Strategy for recalculating retirement.
 */
public class RetireRecalcStrategy implements RecalcStrategy {

  private Scope scope;

  /**
   * Create a new RetireRecalcStrategy.
   *
   * @param scope The scope to use for calculations, null to use engine's current scope
   */
  public RetireRecalcStrategy(Scope scope) {
    this.scope = scope;
  }

  @Override
  public void execute(Engine target) {
    if (!(target instanceof SingleThreadEngine)) {
      throw new IllegalArgumentException(
          "RetireRecalcStrategy requires a SingleThreadEngine");
    }

    SingleThreadEngine engine = (SingleThreadEngine) target;
    
    // Move the logic from SingleThreadEngine.recalcRetire
    // Setup
    OverridingConverterStateGetter stateGetter =
        new OverridingConverterStateGetter(engine.getStateGetter());
    UnitConverter unitConverter = new UnitConverter(stateGetter);
    Scope scopeEffective = scope != null ? scope : engine.getScope();
    String application = scopeEffective.getApplication();
    String substance = scopeEffective.getSubstance();

    // Check allowed
    if (application == null || substance == null) {
      engine.raiseNoAppOrSubstance("recalculating population change", "");
    }

    // Calculate change
    EngineNumber currentPriorRaw = engine.getStreamKeeper().getStream(
        application,
        substance,
        "priorEquipment"
    );
    EngineNumber currentPrior = unitConverter.convert(currentPriorRaw, "units");

    EngineNumber currentEquipmentRaw = engine.getStreamKeeper().getStream(
        application,
        substance,
        "equipment"
    );
    EngineNumber currentEquipment = unitConverter.convert(currentEquipmentRaw, "units");

    stateGetter.setPopulation(currentPrior);
    EngineNumber amountRaw = engine.getStreamKeeper().getRetirementRate(application, substance);
    EngineNumber amount = unitConverter.convert(amountRaw, "units");
    stateGetter.clearPopulation();

    // Calculate new values
    BigDecimal newPriorValue = currentPrior.getValue().subtract(amount.getValue());
    BigDecimal newEquipmentValue = currentEquipment.getValue().subtract(amount.getValue());

    EngineNumber newPrior = new EngineNumber(newPriorValue, "units");
    EngineNumber newEquipment = new EngineNumber(newEquipmentValue, "units");

    // Update equipment streams
    engine.getStreamKeeper().setStream(application, substance, "priorEquipment", newPrior);
    engine.getStreamKeeper().setStream(application, substance, "equipment", newEquipment);

    // Update GHG accounting
    engine.recalcEolEmissions(scopeEffective);

    // Propagate
    engine.recalcPopulationChange(null, null);
    engine.recalcSales(null);
    engine.recalcConsumption(null);
  }
}