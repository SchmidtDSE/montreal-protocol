/**
 * Strategy for recalculating consumption.
 *
 * <p>This strategy encapsulates the logic previously found in the
 * recalcConsumption method of SingleThreadEngine.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.engine.state.Scope;
import org.kigalisim.engine.state.StreamKeeper;

/**
 * Strategy for recalculating consumption.
 */
public class ConsumptionRecalcStrategy implements RecalcStrategy {

  private Scope scope;

  /**
   * Create a new ConsumptionRecalcStrategy.
   *
   * @param scope The scope to use for calculations, null to use engine's current scope
   */
  public ConsumptionRecalcStrategy(Scope scope) {
    this.scope = scope;
  }

  @Override
  public void execute(Engine target) {
    if (!(target instanceof SingleThreadEngine)) {
      throw new IllegalArgumentException(
          "ConsumptionRecalcStrategy requires a SingleThreadEngine");
    }

    SingleThreadEngine engine = (SingleThreadEngine) target;

    // Move the logic from SingleThreadEngine.recalcConsumption
    Scope scopeEffective = scope != null ? scope : engine.getScope();

    String application = scopeEffective.getApplication();
    String substance = scopeEffective.getSubstance();

    if (application == null || substance == null) {
      engine.raiseNoAppOrSubstance("recalculating consumption", "");
    }

    // Update streams using ConsumptionCalculator
    ConsumptionCalculator calculator = new ConsumptionCalculator();

    // Get stream keeper
    StreamKeeper streamKeeper = engine.getStreamKeeper();

    // Get GHG intensity and calculate consumption
    EngineNumber ghgIntensity = streamKeeper.getGhgIntensity(application, substance);
    calculator.setConsumptionRaw(ghgIntensity);
    calculator.setStreamName("consumption");
    calculator.execute(engine);

    // Get energy intensity and calculate energy
    calculator = new ConsumptionCalculator();
    EngineNumber energyIntensity = streamKeeper.getEnergyIntensity(application, substance);
    calculator.setConsumptionRaw(energyIntensity);
    calculator.setStreamName("energy");
    calculator.execute(engine);
  }

  @Override
  public void execute(Engine target, RecalcKit kit) {
    // Move the logic from SingleThreadEngine.recalcConsumption
    Scope scopeEffective = scope != null ? scope : target.getScope();

    String application = scopeEffective.getApplication();
    String substance = scopeEffective.getSubstance();

    if (application == null || substance == null) {
      ExceptionsGenerator.raiseNoAppOrSubstance("recalculating consumption", "");
    }

    // Update streams using ConsumptionCalculator
    ConsumptionCalculator calculator = new ConsumptionCalculator();

    // Get stream keeper from kit
    StreamKeeper streamKeeper = kit.getStreamKeeper().orElseThrow(
        () -> new IllegalStateException("StreamKeeper required for consumption recalculation"));

    // Get GHG intensity and calculate consumption
    EngineNumber ghgIntensity = streamKeeper.getGhgIntensity(application, substance);
    calculator.setConsumptionRaw(ghgIntensity);
    calculator.setStreamName("consumption");
    calculator.execute(target);

    // Get energy intensity and calculate energy
    calculator = new ConsumptionCalculator();
    EngineNumber energyIntensity = streamKeeper.getEnergyIntensity(application, substance);
    calculator.setConsumptionRaw(energyIntensity);
    calculator.setStreamName("energy");
    calculator.execute(target);
  }
}
