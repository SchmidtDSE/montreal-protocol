/**
 * Strategy for recalculating recharge emissions.
 *
 * <p>This strategy encapsulates the logic previously found in the
 * recalcRechargeEmissions method of SingleThreadEngine.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.engine.state.Scope;

/**
 * Strategy for recalculating recharge emissions.
 */
public class RechargeEmissionsRecalcStrategy implements RecalcStrategy {

  private Scope scope;

  /**
   * Create a new RechargeEmissionsRecalcStrategy.
   *
   * @param scope The scope to use for calculations, null to use engine's current scope
   */
  public RechargeEmissionsRecalcStrategy(Scope scope) {
    this.scope = scope;
  }

  @Override
  public void execute(Engine target) {
    if (!(target instanceof SingleThreadEngine)) {
      throw new IllegalArgumentException(
          "RechargeEmissionsRecalcStrategy requires a SingleThreadEngine");
    }

    SingleThreadEngine engine = (SingleThreadEngine) target;
    engine.recalcRechargeEmissions(scope);
  }
}