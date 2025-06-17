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
    engine.recalcEolEmissions(scope);
  }
}