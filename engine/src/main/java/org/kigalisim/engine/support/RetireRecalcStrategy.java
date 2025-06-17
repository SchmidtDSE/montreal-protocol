/**
 * Strategy for recalculating retirement.
 *
 * <p>This strategy encapsulates the logic previously found in the
 * recalcRetire method of SingleThreadEngine.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
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
    engine.recalcRetire(scope);
  }
}