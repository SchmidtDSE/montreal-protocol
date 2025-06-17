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
import org.kigalisim.engine.state.Scope;

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
    engine.recalcConsumption(scope);
  }
}