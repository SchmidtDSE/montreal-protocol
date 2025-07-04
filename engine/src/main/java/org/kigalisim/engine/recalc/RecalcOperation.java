/**
 * Operation that executes a sequence of recalculation strategies.
 *
 * <p>This class takes a list of RecalcStrategy instances and executes them
 * in order on a target Engine. It replaces the manual chaining of recalc
 * method calls previously done directly in SingleThreadEngine.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.recalc;

import java.util.List;
import org.kigalisim.engine.Engine;

/**
 * Operation that executes a sequence of recalculation strategies.
 */
public class RecalcOperation {

  private final List<RecalcStrategy> strategies;
  private final RecalcKit recalcKit;

  /**
   * Create a new RecalcOperation with the given strategies and RecalcKit.
   *
   * @param strategies The list of strategies to execute in order
   * @param recalcKit The RecalcKit containing dependencies for strategies
   */
  public RecalcOperation(List<RecalcStrategy> strategies, RecalcKit recalcKit) {
    if (recalcKit == null) {
      throw new IllegalArgumentException("RecalcKit is required");
    }
    this.strategies = strategies;
    this.recalcKit = recalcKit;
  }

  /**
   * Execute all strategies in order on the target engine.
   *
   * @param target The engine on which to execute the strategies
   */
  public void execute(Engine target) {
    for (RecalcStrategy strategy : strategies) {
      strategy.execute(target, recalcKit);
    }
  }
}
