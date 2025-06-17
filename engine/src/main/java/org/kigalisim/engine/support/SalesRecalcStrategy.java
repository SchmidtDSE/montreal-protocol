/**
 * Strategy for recalculating sales.
 *
 * <p>This strategy encapsulates the logic previously found in the
 * recalcSales method of SingleThreadEngine.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.engine.state.Scope;

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
    engine.recalcSales(scope);
  }
}