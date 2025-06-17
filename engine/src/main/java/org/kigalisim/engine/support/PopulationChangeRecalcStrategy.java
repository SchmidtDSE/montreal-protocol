/**
 * Strategy for recalculating population changes.
 *
 * <p>This strategy encapsulates the logic previously found in the
 * recalcPopulationChange method of SingleThreadEngine.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
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
    // Delegate to the engine's recalc method
    engine.recalcPopulationChange(scope, subtractRecharge);
  }
}