/**
 * Builder for creating RecalcOperation instances with fluent interface.
 *
 * <p>This builder provides a fluent interface for constructing sequences of
 * recalculation operations while enforcing proper ordering (recalc methods first,
 * then propagate methods).</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import java.util.ArrayList;
import java.util.List;
import org.kigalisim.engine.state.Scope;

/**
 * Builder for creating RecalcOperation instances with fluent interface.
 */
public class RecalcOperationBuilder {

  private Scope scopeEffective;
  private Boolean subtractRecharge;
  private final List<RecalcStrategy> strategies;
  private boolean hasInitialRecalc;

  /**
   * Create a new RecalcOperationBuilder.
   */
  public RecalcOperationBuilder() {
    this.strategies = new ArrayList<>();
    this.hasInitialRecalc = false;
  }

  /**
   * Set the scope for all recalculation operations.
   *
   * @param scope The scope to use for calculations
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder setScopeEffective(Scope scope) {
    this.scopeEffective = scope;
    return this;
  }

  /**
   * Set whether to subtract recharge in population calculations.
   *
   * @param subtractRecharge Whether to subtract recharge
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder setSubtractRecharge(Boolean subtractRecharge) {
    this.subtractRecharge = subtractRecharge;
    return this;
  }

  /**
   * Add population change recalculation to the operation sequence.
   *
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder recalcPopulationChange() {
    if (hasInitialRecalc) {
      throw new IllegalStateException(
          "Only one recalc method can be called - use thenPropagate methods for subsequent operations");
    }
    strategies.add(new PopulationChangeRecalcStrategy(scopeEffective, subtractRecharge));
    hasInitialRecalc = true;
    return this;
  }

  /**
   * Add consumption recalculation to the operation sequence.
   *
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder recalcConsumption() {
    if (hasInitialRecalc) {
      throw new IllegalStateException(
          "Only one recalc method can be called - use thenPropagate methods for subsequent operations");
    }
    strategies.add(new ConsumptionRecalcStrategy(scopeEffective));
    hasInitialRecalc = true;
    return this;
  }

  /**
   * Add sales recalculation to the operation sequence.
   *
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder recalcSales() {
    if (hasInitialRecalc) {
      throw new IllegalStateException(
          "Only one recalc method can be called - use thenPropagate methods for subsequent operations");
    }
    strategies.add(new SalesRecalcStrategy(scopeEffective));
    hasInitialRecalc = true;
    return this;
  }

  /**
   * Add recharge emissions recalculation to the operation sequence.
   *
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder recalcRechargeEmissions() {
    if (hasInitialRecalc) {
      throw new IllegalStateException(
          "Only one recalc method can be called - use thenPropagate methods for subsequent operations");
    }
    strategies.add(new RechargeEmissionsRecalcStrategy(scopeEffective));
    hasInitialRecalc = true;
    return this;
  }

  /**
   * Add end-of-life emissions recalculation to the operation sequence.
   *
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder recalcEolEmissions() {
    if (hasInitialRecalc) {
      throw new IllegalStateException(
          "Only one recalc method can be called - use thenPropagate methods for subsequent operations");
    }
    strategies.add(new EolEmissionsRecalcStrategy(scopeEffective));
    hasInitialRecalc = true;
    return this;
  }

  /**
   * Add retirement recalculation to the operation sequence.
   *
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder recalcRetire() {
    if (hasInitialRecalc) {
      throw new IllegalStateException(
          "Only one recalc method can be called - use thenPropagate methods for subsequent operations");
    }
    strategies.add(new RetireRecalcStrategy(scopeEffective));
    hasInitialRecalc = true;
    return this;
  }

  /**
   * Propagate changes to population calculation.
   *
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder thenPropagateToPopulationChange() {
    if (!hasInitialRecalc) {
      throw new IllegalStateException(
          "Must call a recalc method before using thenPropagate methods");
    }
    strategies.add(new PopulationChangeRecalcStrategy(scopeEffective, subtractRecharge));
    return this;
  }

  /**
   * Propagate changes to consumption calculation.
   *
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder thenPropagateToConsumption() {
    if (!hasInitialRecalc) {
      throw new IllegalStateException(
          "Must call a recalc method before using thenPropagate methods");
    }
    strategies.add(new ConsumptionRecalcStrategy(scopeEffective));
    return this;
  }

  /**
   * Propagate changes to sales calculation.
   *
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder thenPropagateToSales() {
    if (!hasInitialRecalc) {
      throw new IllegalStateException(
          "Must call a recalc method before using thenPropagate methods");
    }
    strategies.add(new SalesRecalcStrategy(scopeEffective));
    return this;
  }

  /**
   * Propagate changes to recharge emissions calculation.
   *
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder thenPropagateToRechargeEmissions() {
    if (!hasInitialRecalc) {
      throw new IllegalStateException(
          "Must call a recalc method before using thenPropagate methods");
    }
    strategies.add(new RechargeEmissionsRecalcStrategy(scopeEffective));
    return this;
  }

  /**
   * Propagate changes to end-of-life emissions calculation.
   *
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder thenPropagateToEolEmissions() {
    if (!hasInitialRecalc) {
      throw new IllegalStateException(
          "Must call a recalc method before using thenPropagate methods");
    }
    strategies.add(new EolEmissionsRecalcStrategy(scopeEffective));
    return this;
  }

  /**
   * Propagate changes to retirement calculation.
   *
   * @return This builder for method chaining
   */
  public RecalcOperationBuilder thenPropagateToRetire() {
    if (!hasInitialRecalc) {
      throw new IllegalStateException(
          "Must call a recalc method before using thenPropagate methods");
    }
    strategies.add(new RetireRecalcStrategy(scopeEffective));
    return this;
  }

  /**
   * Build the RecalcOperation from the configured strategies.
   *
   * @return A RecalcOperation containing all configured strategies
   * @throws IllegalStateException if no strategies have been configured
   */
  public RecalcOperation build() {
    if (strategies.isEmpty()) {
      throw new IllegalStateException("Must configure at least one recalculation strategy");
    }
    return new RecalcOperation(new ArrayList<>(strategies));
  }
}