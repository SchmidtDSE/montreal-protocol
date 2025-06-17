/**
 * Strategy for recalculating end-of-life emissions.
 *
 * <p>This strategy encapsulates the logic previously found in the
 * recalcEolEmissions method of SingleThreadEngine.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.engine.number.UnitConverter;
import org.kigalisim.engine.state.OverridingConverterStateGetter;
import org.kigalisim.engine.state.Scope;

/**
 * Strategy for recalculating end-of-life emissions.
 */
public class EolEmissionsRecalcStrategy implements RecalcStrategy {

  private Scope scope;

  /**
   * Create a new EolEmissionsRecalcStrategy.
   *
   * @param scope The scope to use for calculations, null to use engine's current scope
   */
  public EolEmissionsRecalcStrategy(Scope scope) {
    this.scope = scope;
  }

  @Override
  public void execute(Engine target) {
    if (!(target instanceof SingleThreadEngine)) {
      throw new IllegalArgumentException(
          "EolEmissionsRecalcStrategy requires a SingleThreadEngine");
    }

    SingleThreadEngine engine = (SingleThreadEngine) target;
    
    // Move the logic from SingleThreadEngine.recalcEolEmissions
    // Setup
    OverridingConverterStateGetter stateGetter =
        new OverridingConverterStateGetter(engine.getStateGetter());
    UnitConverter unitConverter = new UnitConverter(stateGetter);
    Scope scopeEffective = scope != null ? scope : engine.getScope();
    String application = scopeEffective.getApplication();
    String substance = scopeEffective.getSubstance();

    // Check allowed
    if (application == null || substance == null) {
      engine.raiseNoAppOrSubstance("recalculating EOL emissions change", "");
    }

    // Calculate change
    EngineNumber currentPriorRaw = engine.getStreamRaw(application, substance, "priorEquipment");
    EngineNumber currentPrior = unitConverter.convert(currentPriorRaw, "units");

    stateGetter.setPopulation(currentPrior);
    EngineNumber amountRaw = engine.getStreamKeeper().getRetirementRate(application, substance);
    EngineNumber amount = unitConverter.convert(amountRaw, "units");
    stateGetter.clearPopulation();

    // Update GHG accounting
    EngineNumber eolGhg = unitConverter.convert(amount, "tCO2e");
    engine.getStreamKeeper().setStream(application, substance, "eolEmissions", eolGhg);
  }
}